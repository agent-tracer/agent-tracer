import { EMPTY_RULE_GENERATION_OBSERVATION, RULE_GENERATION_STATUS, type RuleGenerationStatus } from "@agent-tracer/kernel";
import { RuleGenerationEntity } from "@agent-tracer/tracer-model";

export const GENERATION_NOW = new Date("2026-01-01T00:00:00.000Z");

export interface RuleGenerationSeed {
    readonly id?: string;
    readonly userId?: string;
    readonly taskId?: string;
    readonly anchorEventId?: string;
    readonly status?: RuleGenerationStatus;
    readonly leaseOwner?: string | null;
    readonly maxRules?: number | null;
}

/** 테스트가 쓰는 규칙 생성 요청 한 줄이다. */
export function generationRow(seed: RuleGenerationSeed = {}): RuleGenerationEntity {
    const row = new RuleGenerationEntity();
    row.id = seed.id ?? "gen-1";
    row.userId = seed.userId ?? "u1";
    row.taskId = seed.taskId ?? "task-1";
    row.anchorEventId = seed.anchorEventId ?? "anchor-1";
    row.intent = null;
    row.maxRules = seed.maxRules ?? null;
    row.status = seed.status ?? RULE_GENERATION_STATUS.pending;
    row.leaseOwner = seed.leaseOwner ?? null;
    row.leaseExpiresAt = seed.leaseOwner === undefined || seed.leaseOwner === null
        ? null
        : new Date(GENERATION_NOW.getTime() + 60_000);
    row.observation = EMPTY_RULE_GENERATION_OBSERVATION;
    row.steps = [];
    row.skipped = [];
    row.createdRuleIds = [];
    row.error = null;
    row.createdAt = GENERATION_NOW;
    row.startedAt = null;
    row.finishedAt = null;
    return row;
}
