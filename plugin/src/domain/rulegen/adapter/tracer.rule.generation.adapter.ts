import {MONITOR_LEASE_OWNER_HEADER} from "@agent-tracer/kernel/user/user.header.const.js";
import {
    RULE_GENERATION_STATUS,
    RULE_GENERATIONS_PATH,
    isTerminalRuleGenerationStatus,
} from "@agent-tracer/kernel";
import {getJson, postJson} from "~plugin/config/http.js";
import type {
    PendingRuleGeneration,
    RuleGenerationFailure,
    RuleGenerationReport,
    RuleAnchorEvidence,
    RuleGenerationUsage,
    RuleGenerationLeaseState,
} from "~plugin/domain/rulegen/model/rule.generation.model.js";
import type {RulegenLogPort} from "~plugin/domain/rulegen/port/log.port.js";
import type {RuleGenerationPort} from "~plugin/domain/rulegen/port/rule.generation.port.js";

const HELD_LEASE: RuleGenerationLeaseState = {leaseHeld: true, canceled: false};
const REPORT_MAX_ATTEMPTS = 3;
const REPORT_BACKOFF_MS = 500;

interface RequestListEnvelope {
    readonly data?: {readonly items?: readonly PendingRuleGeneration[]};
}

interface TaskEnvelope {
    readonly data?: {readonly task: {readonly workspacePath?: string} | null};
}

interface UserInputEnvelope {
    readonly data?: {readonly items?: readonly {readonly eventId: string; readonly text: string; readonly turnId?: string | null}[]};
}

interface LeaseEnvelope {
    readonly data?: RuleGenerationLeaseState;
}

/** 이 왕복이 관측의 유일한 통로이므로 잰 것을 계약이 적은 칸에 실어 원장까지 보낸다. */
function observation(outcome: {
    readonly modelUsed: string | null;
    readonly durationMs: number | null;
    readonly costUsd: number | null;
    readonly numTurns: number | null;
    readonly usage?: RuleGenerationUsage;
}): Record<string, unknown> {
    return {
        model: outcome.modelUsed,
        durationMs: outcome.durationMs,
        costUsd: outcome.costUsd,
        numTurns: outcome.numTurns,
        inputTokens: outcome.usage?.inputTokens ?? null,
        outputTokens: outcome.usage?.outputTokens ?? null,
        cacheReadTokens: outcome.usage?.cacheReadTokens ?? null,
        cacheCreationTokens: outcome.usage?.cacheCreationTokens ?? null,
    };
}

/** 종결 창구는 계약이 적은 규칙과 버린 사유와 이 실행의 관측과 궤적을 받는다. */
function completeBody(report: RuleGenerationReport): Record<string, unknown> {
    return {
        rules: report.proposals,
        skipped: report.skipped,
        observation: observation(report),
        steps: report.steps,
    };
}

function failBody(failure: RuleGenerationFailure): Record<string, unknown> {
    return {message: failure.error, observation: observation(failure), steps: failure.steps};
}

/** 규칙 생성 요청의 수명주기를 이 저장소의 규칙 도메인 창구로 왕복한다. */
export class TracerRuleGenerationAdapter implements RuleGenerationPort {
    private readonly leaseHeaders: Record<string, string>;

    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
        leaseOwner: string,
        private readonly log: RulegenLogPort,
    ) {
        this.leaseHeaders = {...headers, [MONITOR_LEASE_OWNER_HEADER]: leaseOwner};
    }

    async pendingRequests(): Promise<readonly PendingRuleGeneration[]> {
        const url = `${this.baseUrl}${RULE_GENERATIONS_PATH}?status=${RULE_GENERATION_STATUS.pending}`;
        const fetched = await getJson<RequestListEnvelope>(url, this.headers);
        if (fetched.kind !== "found") {
            this.log.write(`could not read pending requests: ${fetched.kind}`);
            return [];
        }
        return fetched.value.data?.items ?? [];
    }

    async workspacePath(taskId: string): Promise<string | null> {
        const url = `${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}`;
        const fetched = await getJson<TaskEnvelope>(url, this.headers);
        return (fetched.kind === "found" ? fetched.value.data?.task?.workspacePath : undefined) ?? null;
    }

    async anchor(taskId: string, anchorEventId: string): Promise<RuleAnchorEvidence | undefined> {
        try {
            const url = `${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}/user-inputs`;
            const fetched = await getJson<UserInputEnvelope>(url, this.headers);
            if (fetched.kind !== "found") return undefined;
            const item = fetched.value.data?.items?.find((entry) => entry.eventId === anchorEventId);
            if (item === undefined) return undefined;
            return {text: item.text, turnId: item.turnId ?? null};
        } catch {
            return undefined;
        }
    }

    async claim(requestId: string): Promise<boolean> {
        const response = await postJson(this.requestUrl(requestId, "claim"), this.leaseHeaders, {});
        return response.ok;
    }

    async renewLease(requestId: string): Promise<RuleGenerationLeaseState> {
        const response = await postJson(this.requestUrl(requestId, "heartbeat"), this.leaseHeaders, {});
        if (!response.ok) return HELD_LEASE;
        const body = await response.json() as LeaseEnvelope;
        return body.data ?? HELD_LEASE;
    }

    async reportResult(requestId: string, report: RuleGenerationReport): Promise<boolean> {
        for (let attempt = 1; attempt <= REPORT_MAX_ATTEMPTS; attempt += 1) {
            try {
                const response = await postJson(
                    this.requestUrl(requestId, "complete"),
                    this.leaseHeaders,
                    completeBody(report),
                );
                if (response.ok) return true;
                throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                if (attempt === REPORT_MAX_ATTEMPTS) {
                    this.log.write(`result report failed for request ${requestId}: ${String(error)}`);
                    return false;
                }
                await sleep(REPORT_BACKOFF_MS * attempt);
            }
        }
        return false;
    }

    async fail(requestId: string, failure: RuleGenerationFailure): Promise<void> {
        await postJson(this.requestUrl(requestId, "fail"), this.leaseHeaders, failBody(failure));
    }

    async release(requestId: string): Promise<void> {
        await postJson(this.requestUrl(requestId, "release"), this.leaseHeaders, {});
    }

    async hasActiveRequest(taskId: string): Promise<boolean> {
        const url = `${this.baseUrl}${RULE_GENERATIONS_PATH}?taskId=${encodeURIComponent(taskId)}&limit=1`;
        const fetched = await getJson<RequestListEnvelope>(url, this.headers);
        if (fetched.kind !== "found") return false;
        const latest = fetched.value.data?.items?.[0];
        return latest !== undefined && !isTerminalRuleGenerationStatus(latest.status ?? "");
    }

    async enqueue(taskId: string, anchorEventId: string, maxRules: number): Promise<boolean> {
        const response = await postJson(`${this.baseUrl}${RULE_GENERATIONS_PATH}`, this.headers, {
            taskId,
            anchorEventId,
            maxRules,
        });
        return response.ok;
    }

    private requestUrl(id: string, action: string): string {
        return `${this.baseUrl}${RULE_GENERATIONS_PATH}/${encodeURIComponent(id)}/${action}`;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
