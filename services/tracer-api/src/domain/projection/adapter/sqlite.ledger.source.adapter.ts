import { Injectable } from "@nestjs/common";
import type { DataSource } from "typeorm";
import type { EventKind } from "@agent-tracer/kernel";
import type { LedgerSource } from "~tracer-api/support/ledger.source.js";
import type { LedgerRecord } from "~tracer-api/support/ledger.record.js";

/** 원장 테이블의 한 행을 그대로 받은 모양이다. */
interface LedgerRow {
    readonly seq: number;
    readonly id: string;
    readonly user_id: string;
    readonly task_id: string;
    readonly session_id: string | null;
    readonly kind: string;
    readonly occurred_at: string;
    readonly received_at: string;
    readonly trace_id: string;
    readonly span_id: string;
    readonly parent_span_id: string | null;
    readonly payload: string;
}

const SELECT_AFTER = `
    SELECT seq, id, user_id, task_id, session_id, kind, occurred_at, received_at,
           trace_id, span_id, parent_span_id, payload
    FROM events
    WHERE seq > ?
    ORDER BY seq
    LIMIT ?
`;

/** 원장은 다른 배포 단위가 소유하므로 엔티티를 복제하지 않고 CDC가 그랬듯 질의로만 읽는다. */
@Injectable()
export class SqliteLedgerSourceAdapter implements LedgerSource {
    private tableSeen = false;

    constructor(private readonly ledger: DataSource) {}

    async readAfter(seq: number, limit: number): Promise<readonly LedgerRecord[]> {
        if (!await this.hasLedgerTable()) return [];
        const rows = await this.ledger.query<LedgerRow[]>(SELECT_AFTER, [seq, limit]);
        return rows.map((row) => toRecord(row));
    }

    // 원장 스키마는 인제스트가 세우므로 그쪽이 아직 뜨지 않은 동안은 읽을 것이 없는 상태로 본다.
    private async hasLedgerTable(): Promise<boolean> {
        if (this.tableSeen) return true;
        const found = await this.ledger.query<unknown[]>(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'events'",
        );
        this.tableSeen = found.length > 0;
        return this.tableSeen;
    }
}

function toRecord(row: LedgerRow): LedgerRecord {
    const occurredAt = new Date(row.occurred_at);
    return {
        id: row.id,
        seq: String(row.seq),
        userId: row.user_id,
        taskId: row.task_id,
        sessionId: row.session_id,
        kind: row.kind as EventKind,
        occurredAt,
        receivedAt: new Date(row.received_at),
        traceId: row.trace_id,
        spanId: row.span_id,
        parentSpanId: row.parent_span_id,
        payload: JSON.parse(row.payload) as Record<string, unknown>,
    };
}
