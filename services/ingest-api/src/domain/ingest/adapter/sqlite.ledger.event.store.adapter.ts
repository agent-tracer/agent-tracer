import { Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm";
import type {
    LedgerEventRecord,
    LedgerEventStore,
} from "~ingest-api/domain/ingest/port/ledger.event.store.port.js";
import { EVENT_DATA_SOURCE } from "~ingest-api/config/event.datasource.token.js";
import { LocalLedgerEventEntity } from "./local.ledger.event.entity.js";

/** 원장 포트를 로컬 sqlite 파일에 연결한다. */
@Injectable()
export class SqliteLedgerEventStoreAdapter implements LedgerEventStore {
    constructor(@Inject(EVENT_DATA_SOURCE) private readonly dataSource: DataSource) {}

    // 별도 claim 테이블 없이 이벤트 ID 유니크 충돌을 무시해 멱등성을 얻는다.
    async appendAll(rows: readonly LedgerEventRecord[]): Promise<void> {
        const uniqueRows = uniqueById(rows);
        if (uniqueRows.length === 0) return;
        const receivedAt = new Date().toISOString();
        await this.dataSource.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .insert()
                .into(LocalLedgerEventEntity)
                .values(uniqueRows.map((row) => ({
                    id: row.id,
                    userId: row.userId,
                    taskId: row.taskId,
                    sessionId: row.sessionId,
                    kind: row.kind,
                    occurredAt: row.occurredAt.toISOString(),
                    receivedAt,
                    traceId: row.traceId,
                    spanId: row.spanId,
                    parentSpanId: row.parentSpanId,
                    turnId: row.turnId,
                    parentId: row.parentId,
                    payload: row.payload,
                })) as QueryDeepPartialEntity<LocalLedgerEventEntity>[])
                .orIgnore()
                .execute();
        });
    }
}

function uniqueById(rows: readonly LedgerEventRecord[]): LedgerEventRecord[] {
    const unique = new Map<string, LedgerEventRecord>();
    for (const row of rows) {
        if (!unique.has(row.id)) unique.set(row.id, row);
    }
    return [...unique.values()];
}
