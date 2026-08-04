export const LEDGER_EVENT_STORE = Symbol("LEDGER_EVENT_STORE");

/** 수용된 이벤트를 영속성 기술과 무관한 원장 레코드로 저장한다. */
export interface LedgerEventStore {
    appendAll(rows: readonly LedgerEventRecord[]): Promise<void>;
}

/** 원장에 추가할 이벤트의 애플리케이션 표현이다. */
export interface LedgerEventRecord {
    readonly id: string;
    readonly userId: string;
    readonly taskId: string;
    readonly sessionId: string | null;
    readonly kind: string;
    readonly occurredAt: Date;
    readonly traceId: string;
    readonly spanId: string;
    readonly parentSpanId: string | null;
    readonly payload: Record<string, unknown>;
    /** 트레이스 식별자로 접히기 전의 원본 상관 식별자이며 로컬 원장만 그대로 보관한다. */
    readonly turnId: string | null;
    readonly parentId: string | null;
}
