import {JOB_KIND, JOB_STATUS, RULE_GENERATION_FOCUS} from "@agent-tracer/kernel/job/job.const.js";
import {MONITOR_LEASE_OWNER_HEADER} from "@agent-tracer/kernel/user/user.header.const.js";
import {getJson, postJson} from "~plugin/config/http.js";
import type {
    PendingRuleJob,
    RuleGenerationFailure,
    RuleGenerationReport,
    RuleJobLeaseState,
} from "~plugin/domain/rulegen/model/rule.job.model.js";
import {ruleGenLogLine} from "~plugin/domain/rulegen/model/rulegen.log.model.js";
import type {RuleJobPort} from "~plugin/domain/rulegen/port/rule.job.port.js";

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([JOB_STATUS.pending, JOB_STATUS.running]);
const HELD_LEASE: RuleJobLeaseState = {leaseHeld: true, canceled: false};
const REPORT_MAX_ATTEMPTS = 3;
const REPORT_BACKOFF_MS = 500;

// 잡은 에이전트 서비스가 소유하므로 게이트웨이의 에이전트 접두사 아래로 부른다.
const AGENT_JOBS = "/api/agent/jobs";

interface JobListEnvelope {
    readonly data?: {readonly items?: readonly PendingRuleJob[]};
}

interface LatestJobEnvelope {
    readonly data?: {readonly job: {readonly status: string} | null};
}

interface TaskEnvelope {
    readonly data?: {readonly task: {readonly workspacePath?: string} | null};
}

interface UserInputEnvelope {
    readonly data?: {readonly items?: readonly {readonly eventId: string; readonly text: string}[]};
}

interface LeaseEnvelope {
    readonly data?: RuleJobLeaseState;
}

/** 산출 창구는 계약이 적은 규칙과 버린 사유만 받으므로 실행 관측은 이 왕복에 싣지 않는다. */
function resultBody(report: RuleGenerationReport): Record<string, unknown> {
    return {
        rules: report.proposals,
        ...(report.skipped.length > 0 ? {skipped: report.skipped} : {}),
    };
}

/** 실패 창구는 계약이 적은 사유만 받는다. */
function failureBody(failure: RuleGenerationFailure): Record<string, unknown> {
    return {message: failure.error};
}

/** 규칙 생성 잡의 수명주기를 서버 잡 API로 왕복한다. */
export class HttpRuleJobAdapter implements RuleJobPort {
    private readonly leaseHeaders: Record<string, string>;

    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
        leaseOwner: string,
    ) {
        this.leaseHeaders = {...headers, [MONITOR_LEASE_OWNER_HEADER]: leaseOwner};
    }

    async pendingJobs(): Promise<readonly PendingRuleJob[]> {
        const url = `${this.baseUrl}${AGENT_JOBS}?kind=${encodeURIComponent(JOB_KIND.ruleGeneration)}&status=${encodeURIComponent(JOB_STATUS.pending)}`;
        const fetched = await getJson<JobListEnvelope>(url, this.headers);
        return fetched.kind === "found" ? (fetched.value.data?.items ?? []) : [];
    }

    async workspacePath(taskId: string): Promise<string | null> {
        const url = `${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}`;
        const fetched = await getJson<TaskEnvelope>(url, this.headers);
        return (fetched.kind === "found" ? fetched.value.data?.task?.workspacePath : undefined) ?? null;
    }

    async anchorText(taskId: string, anchorEventId: string): Promise<string | undefined> {
        try {
            const url = `${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}/user-inputs`;
            const fetched = await getJson<UserInputEnvelope>(url, this.headers);
            if (fetched.kind !== "found") return undefined;
            return fetched.value.data?.items?.find((item) => item.eventId === anchorEventId)?.text;
        } catch {
            return undefined;
        }
    }

    async claim(jobId: string): Promise<boolean> {
        const response = await postJson(this.jobUrl(jobId, "start"), this.leaseHeaders, {});
        return response.ok;
    }

    async renewLease(jobId: string): Promise<RuleJobLeaseState> {
        const response = await postJson(this.jobUrl(jobId, "lease"), this.leaseHeaders, {});
        if (!response.ok) return HELD_LEASE;
        const body = await response.json() as LeaseEnvelope;
        return body.data ?? HELD_LEASE;
    }

    async reportResult(jobId: string, report: RuleGenerationReport): Promise<boolean> {
        for (let attempt = 1; attempt <= REPORT_MAX_ATTEMPTS; attempt += 1) {
            try {
                const response = await postJson(this.jobUrl(jobId, "results"), this.leaseHeaders, resultBody(report));
                if (response.ok) return true;
                throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                if (attempt === REPORT_MAX_ATTEMPTS) {
                    process.stderr.write(ruleGenLogLine(`result report failed for job ${jobId}: ${String(error)}`));
                    return false;
                }
                await sleep(REPORT_BACKOFF_MS * attempt);
            }
        }
        return false;
    }

    async fail(jobId: string, failure: RuleGenerationFailure): Promise<void> {
        await postJson(this.jobUrl(jobId, "fail"), this.leaseHeaders, failureBody(failure));
    }

    async release(jobId: string): Promise<void> {
        await postJson(this.jobUrl(jobId, "release"), this.leaseHeaders, {});
    }

    async hasActiveJob(taskId: string): Promise<boolean> {
        const url = `${this.baseUrl}${AGENT_JOBS}/latest?kind=${encodeURIComponent(JOB_KIND.ruleGeneration)}&taskId=${encodeURIComponent(taskId)}`;
        const fetched = await getJson<LatestJobEnvelope>(url, this.headers);
        const status = fetched.kind === "found" ? fetched.value.data?.job?.status : undefined;
        return status !== undefined && ACTIVE_STATUSES.has(status);
    }

    async enqueue(taskId: string, anchorEventId: string, maxRules: number): Promise<boolean> {
        const response = await postJson(`${this.baseUrl}${AGENT_JOBS}`, this.headers, {
            kind: JOB_KIND.ruleGeneration,
            input: {
                taskId,
                anchorEventId,
                focus: RULE_GENERATION_FOCUS.recent,
                maxRules,
            },
            idempotencyKey: anchorEventId,
        });
        return response.ok;
    }

    private jobUrl(jobId: string, action: string): string {
        return `${this.baseUrl}${AGENT_JOBS}/${encodeURIComponent(jobId)}/${action}`;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
