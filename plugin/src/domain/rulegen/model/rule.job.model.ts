import {normalizeRuleGenerationIntent} from "@agent-tracer/kernel/job/job.const.js";
import type {AiJobStepPayload} from "@agent-tracer/kernel/job/job.step.const.js";
import type {RuleProposalPayload} from "@agent-tracer/kernel/rule/proposal/rule.proposal.schema.js";
import type {RuleGenerationRequest} from "~plugin/domain/rulegen/model/rulegen.spec.model.js";

/** 서버가 내려주는 대기 중 규칙 생성 요청이다. */
export interface PendingRuleJob {
    readonly id: string;
    readonly taskId: string | null;
    readonly anchorEventId?: string | null;
    readonly intent?: unknown;
    readonly maxRules?: number | null;
    readonly status?: string;
}

/** 앵커가 가리키는 사용자 발화이며 turnId가 있어야 규칙이 그 턴을 인용할 수 있다. */
export interface RuleAnchorEvidence {
    readonly text: string;
    readonly turnId: string | null;
}

/** 잡을 계속 쥐고 있어도 되는지 알려주는 리스 상태다. */
export interface RuleJobLeaseState {
    readonly leaseHeld: boolean;
    readonly canceled: boolean;
}

export interface RuleGenerationUsage {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cacheReadTokens: number;
    readonly cacheCreationTokens: number;
}

/** 실행기가 명세를 돌리고 돌려주는 원시 결과이며 실패해도 그때까지의 비용과 궤적을 싣는다. */
export interface RuleGenerationOutcome {
    readonly candidates: readonly unknown[];
    readonly costUsd: number | null;
    readonly numTurns: number | null;
    readonly usage: RuleGenerationUsage | null;
    readonly steps: readonly AiJobStepPayload[];
    readonly error: string | null;
}

function addTotals(first: number | null, second: number | null): number | null {
    if (first === null && second === null) return null;
    return (first ?? 0) + (second ?? 0);
}

function addUsage(
    first: RuleGenerationUsage | null,
    second: RuleGenerationUsage | null,
): RuleGenerationUsage | null {
    if (first === null) return second;
    if (second === null) return first;
    return {
        inputTokens: first.inputTokens + second.inputTokens,
        outputTokens: first.outputTokens + second.outputTokens,
        cacheReadTokens: first.cacheReadTokens + second.cacheReadTokens,
        cacheCreationTokens: first.cacheCreationTokens + second.cacheCreationTokens,
    };
}

/** 수리까지 두 번 실행하면 비용과 궤적이 둘 다 청구된 것이므로 합쳐서 보고하고 후보는 나중 것만 남긴다. */
export function mergeRuleGenerationOutcomes(
    first: RuleGenerationOutcome,
    second: RuleGenerationOutcome,
): RuleGenerationOutcome {
    return {
        candidates: second.candidates,
        costUsd: addTotals(first.costUsd, second.costUsd),
        numTurns: addTotals(first.numTurns, second.numTurns),
        usage: addUsage(first.usage, second.usage),
        steps: [...first.steps, ...second.steps].map((step, seq) => ({...step, seq})),
        error: second.error,
    };
}

/** 서버에 보고하는 규칙 생성 결과다. */
export interface RuleGenerationReport {
    readonly proposals: readonly RuleProposalPayload[];
    /** 근거가 서지 않아 버린 제안의 사유이며 계약의 skipped 자리에 실린다. */
    readonly skipped: readonly string[];
    readonly modelUsed: string;
    readonly durationMs: number;
    readonly costUsd: number | null;
    readonly numTurns: number | null;
    readonly usage?: RuleGenerationUsage;
    readonly steps: readonly AiJobStepPayload[];
}

/** 서버에 보고하는 규칙 생성 실패이며 실패한 시도가 이미 청구한 비용과 궤적을 그대로 넘긴다. */
export interface RuleGenerationFailure {
    readonly error: string;
    readonly modelUsed: string | null;
    readonly durationMs: number | null;
    readonly costUsd: number | null;
    readonly numTurns: number | null;
    readonly usage?: RuleGenerationUsage;
    readonly steps: readonly AiJobStepPayload[];
}

/** 실행기를 부르기도 전에 끝난 실패라 청구한 것도 남긴 궤적도 없다. */
export function ruleGenerationFailure(error: string): RuleGenerationFailure {
    return {error, modelUsed: null, durationMs: null, costUsd: null, numTurns: null, steps: []};
}

/** 폴러가 클레임한 잡 하나를 끝까지 처리하는 실행 경로다. */
export type RuleJobRunner = (request: RuleGenerationRequest, signal: AbortSignal) => Promise<void>;

export function readJobMaxRules(job: PendingRuleJob): number | undefined {
    return typeof job.maxRules === "number" ? job.maxRules : undefined;
}

export function readJobIntent(job: PendingRuleJob): string | undefined {
    return normalizeRuleGenerationIntent(job.intent);
}

export function readJobAnchorEventId(job: PendingRuleJob): string | undefined {
    const value = job.anchorEventId;
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export interface RuleJobContext {
    readonly workspacePath: string;
    readonly anchorEventId: string;
    readonly anchorText: string;
    readonly anchorTurnId: string | null;
    readonly model: string;
    readonly language: string;
    readonly effort: string;
}

export function toRuleGenerationRequest(
    job: PendingRuleJob,
    taskId: string,
    context: RuleJobContext,
): RuleGenerationRequest {
    const maxRules = readJobMaxRules(job);
    const intent = readJobIntent(job);
    return {
        jobId: job.id,
        taskId,
        workspacePath: context.workspacePath,
        ...(maxRules !== undefined ? {maxRules} : {}),
        ...(intent !== undefined ? {intent} : {}),
        ...(context.anchorTurnId !== null ? {anchorTurnId: context.anchorTurnId} : {}),
        anchorEventId: context.anchorEventId,
        model: context.model,
        language: context.language,
        effort: context.effort,
        anchorText: context.anchorText,
    };
}
