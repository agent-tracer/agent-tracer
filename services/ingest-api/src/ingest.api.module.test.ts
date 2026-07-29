import { describe, expect, it } from "vitest";
import { INGEST_EVENT_LOG } from "~ingest-api/domain/ingest/port/ingest.event.log.port.js";
import { LEDGER_EVENT_STORE } from "~ingest-api/domain/ingest/port/ledger.event.store.port.js";
import { StructuredIngestEventLogAdapter } from "~ingest-api/domain/ingest/adapter/structured.ingest.event.log.adapter.js";
import { TypeOrmLedgerEventStoreAdapter } from "~ingest-api/domain/ingest/adapter/typeorm.ledger.event.store.adapter.js";
import { READINESS_PROBE } from "~ingest-api/domain/health/port/readiness.probe.port.js";
import { DataSourceReadinessProbeAdapter } from "~ingest-api/domain/health/adapter/datasource.readiness.probe.adapter.js";
import { IngestApiModule } from "./ingest.api.module.js";

describe("IngestApiModule", () => {
    it("각 슬라이스의 포트를 자기 어댑터에 연결한다", () => {
        const module = IngestApiModule.forRoot(undefined as never);

        expect(module.providers).toEqual(expect.arrayContaining([
            { provide: LEDGER_EVENT_STORE, useExisting: TypeOrmLedgerEventStoreAdapter },
            { provide: INGEST_EVENT_LOG, useExisting: StructuredIngestEventLogAdapter },
            { provide: READINESS_PROBE, useExisting: DataSourceReadinessProbeAdapter },
        ]));
    });
});
