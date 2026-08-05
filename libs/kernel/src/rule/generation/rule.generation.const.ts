/** 규칙 생성 요청의 수명 상태이며 실행기와 화면이 같은 값을 읽는다. */
export const RULE_GENERATION_STATUS = {
    pending: "pending",
    running: "running",
    completed: "completed",
    failed: "failed",
    canceled: "canceled",
} as const;

export type RuleGenerationStatus = (typeof RULE_GENERATION_STATUS)[keyof typeof RULE_GENERATION_STATUS];

export const RULE_GENERATION_STATUSES: readonly RuleGenerationStatus[] = Object.values(RULE_GENERATION_STATUS);

/** 취소를 종료 상태에 두어야 종결 창구가 취소된 요청을 덮어쓰지 않는다. */
export function isTerminalRuleGenerationStatus(status: string): boolean {
    return (
        status === RULE_GENERATION_STATUS.completed
        || status === RULE_GENERATION_STATUS.failed
        || status === RULE_GENERATION_STATUS.canceled
    );
}

/** 실행기가 요청을 쥐고 있음을 알리는 리스의 수명이며 하트비트가 이보다 잦아야 한다. */
export const RULE_GENERATION_LEASE_TTL_MS = 90_000;
export const RULE_GENERATION_HEARTBEAT_MS = 30_000;

/** 프롬프트에 그대로 실리므로 입력 표면과 실행 표면이 같은 값으로 잘라야 하는 상한이다. */
export const RULE_GENERATION_INTENT_MAX_LENGTH = 500;

/** 빈 문자열을 요청에 남기면 멱등이 의도 없는 요청과 갈라지므로 공백뿐인 의도는 없는 것으로 본다. */
export function normalizeRuleGenerationIntent(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;
    return trimmed.slice(0, RULE_GENERATION_INTENT_MAX_LENGTH);
}

/** 요청 하나가 받을 수 있는 규칙 수의 상한이다. */
export const RULE_GENERATION_MAX_RULES_LIMIT = 20;

/** 실행이 잰 것이며 실패해도 그때까지 청구된 값을 그대로 싣는다. */
export interface RuleGenerationObservation {
    readonly model: string | null;
    readonly costUsd: number | null;
    readonly numTurns: number | null;
    readonly durationMs: number | null;
    readonly inputTokens: number | null;
    readonly outputTokens: number | null;
    readonly cacheReadTokens: number | null;
    readonly cacheCreationTokens: number | null;
}

export const EMPTY_RULE_GENERATION_OBSERVATION: RuleGenerationObservation = {
    model: null,
    costUsd: null,
    numTurns: null,
    durationMs: null,
    inputTokens: null,
    outputTokens: null,
    cacheReadTokens: null,
    cacheCreationTokens: null,
};
