import "reflect-metadata";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import {
    assertSchemaUpToDate, getMigrationNames,
    createDataSource,
    loadApplicationConfig,
    SchemaOutOfDateError,
} from "@agent-tracer/platform";
import { EventIngestKeyEntity } from "~ingest-api/domain/ingest/adapter/event.ingest.key.entity.js";
import { LedgerEventEntity } from "~ingest-api/domain/ingest/adapter/ledger.event.entity.js";
import { LEDGER_MIGRATIONS } from "~ingest-api/migrations/registry.js";
import { errorMessage, logError, logInfo } from "~ingest-api/config/log.js";
import { resolveIngestRateLimitConfig } from "~ingest-api/domain/ingest/inbound/ingest.rate-limit.guard.js";
import { IngestApiModule } from "./ingest.api.module.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;
const BODY_LIMIT = "8mb";

async function bootstrap(): Promise<void> {
    const config = loadApplicationConfig();
    // 마이그레이션은 배포 선행 스텝이 소유하고 부트는 스키마 버전만 검사한다.
    const dataSource = createDataSource({
        db: config.eventDb,
        entities: [LedgerEventEntity, EventIngestKeyEntity],
        migrations: [],
        migrationsRun: false,
    });
    await dataSource.initialize();
    await assertSchemaUpToDate(dataSource, getMigrationNames(LEDGER_MIGRATIONS));

    const app = await NestFactory.create<NestExpressApplication>(
        IngestApiModule.forRoot(dataSource),
        { logger: ["error", "warn"] },
    );
    app.use(helmet());

    // 이벤트 배치에는 도구 출력이 포함되므로 기본 100kb보다 큰 본문을 허용한다.
    app.useBodyParser("json", { limit: BODY_LIMIT });

    const host = config.listenHost;
    const { port } = config.ingestApi;
    await app.listen(port, host);
    const rateLimit = resolveIngestRateLimitConfig();
    logInfo({
        msg: "process.lifecycle.started",
        host,
        port,
        bodyLimit: BODY_LIMIT,
        rateLimitCapacity: rateLimit.capacity,
        rateLimitRefillPerSec: rateLimit.refillPerSec,
    });

    let shuttingDown = false;
    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
        if (shuttingDown) return;
        shuttingDown = true;
        logInfo({ msg: "process.lifecycle.stopping", signal });

        const forceExit = setTimeout(() => {
            logError({ msg: "process.shutdown.timed_out" });
            process.exit(1);
        }, SHUTDOWN_TIMEOUT_MS);
        forceExit.unref();
        try {
            await app.close();
            await dataSource.destroy();
            process.exit(0);
        } catch (error) {
            logError({ msg: "process.shutdown.failed", error: errorMessage(error) });
            process.exit(1);
        }
    };
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
    process.once("SIGINT", () => void shutdown("SIGINT"));
}

await bootstrap().catch((error: unknown) => {
    if (error instanceof SchemaOutOfDateError) {
        logError({ msg: "process.schema.out_of_date", missingMigrations: error.missingMigrations });
        process.exit(1);
    }
    logError({ msg: "process.bootstrap.failed", error: errorMessage(error) });
    process.exit(1);
});
