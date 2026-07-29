import "reflect-metadata";
import { createDataSource, loadApplicationConfig } from "@agent-tracer/platform";
import { EventIngestKeyEntity } from "~ingest-api/domain/ingest/adapter/event.ingest.key.entity.js";
import { LedgerEventEntity } from "~ingest-api/domain/ingest/adapter/ledger.event.entity.js";
import { LEDGER_MIGRATIONS } from "~ingest-api/migrations/registry.js";

// 마이그레이션 CLI가 읽는 DataSource이며 원장 엔티티와 마이그레이션을 등록한다.
const eventDataSource = createDataSource({
    db: loadApplicationConfig().runtimeDb,
    entities: [LedgerEventEntity, EventIngestKeyEntity],
    migrations: [...LEDGER_MIGRATIONS],
});

export default eventDataSource;
