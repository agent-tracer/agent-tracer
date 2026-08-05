/** 심각도 단계마다 무엇이 일어나는지 못박는 절이다. */
export const SEVERITY_CLAUSE = {
    block: '  - "block" halts the agent\'s turn when the obligation is unfulfilled. Reserve it for an explicit, unambiguous user imperative ("반드시", "must always") whose violation would be a real failure.',
    warn: '  - "warn" also halts the turn when the obligation is unfulfilled. Use it for a clear obligation the user actually asked for.',
    info: '  - "info" only records the verdict and never interrupts the agent. Use it for soft or inferred expectations.',
} as const;

/** 규칙은 사람이 승인하기 전에도 판정을 열 수 있으므로 상향의 문턱이 높다. */
export const SEVERITY_HEADING = 'Severity guidance (default to "info" and escalate only on unmistakable evidence):';

export function buildSeverityGuidance(): string {
    return [SEVERITY_HEADING, SEVERITY_CLAUSE.block, SEVERITY_CLAUSE.warn, SEVERITY_CLAUSE.info].join("\n");
}
