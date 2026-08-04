import "reflect-metadata";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import {
    createDataSource,
    loadApplicationConfig,
    SQLITE_PROFILE,
    SystemClock,
} from "@agent-tracer/platform";
import type { createKafka } from "@agent-tracer/platform";
import { TRACER_ENTITIES } from "@agent-tracer/tracer-model";
import { TypeOrmTracerDatabaseAdapter } from "~tracer-api/domain/projection/adapter/typeorm.tracer.database.adapter.js";
import { LocalProjectionCursorEntity } from "~tracer-api/domain/projection/adapter/local.projection.cursor.entity.js";
import { SqliteLedgerSourceAdapter } from "~tracer-api/domain/projection/adapter/sqlite.ledger.source.adapter.js";
import { TypeOrmProjectionCursorAdapter } from "~tracer-api/domain/projection/adapter/typeorm.projection.cursor.adapter.js";
import { LedgerPollConsumer } from "~tracer-api/domain/projection/inbound/ledger.poll.consumer.js";
import { LocalSearchOutboxLockAdapter } from "~tracer-api/domain/index/adapter/local.search.outbox.lock.adapter.js";
import { NoopSearchIndexAdapter } from "~tracer-api/domain/index/adapter/noop.search.index.adapter.js";
import { SearchOutboxDrainUseCase } from "~tracer-api/domain/index/application/search.outbox.drain.usecase.js";
import { createIngestProxy } from "~tracer-api/config/local.ingest.proxy.js";
import { PeriodicScheduler } from "~tracer-api/config/periodic.scheduler.js";
import { NotificationBroadcaster } from "~tracer-api/config/notification.broadcaster.js";
import { WsGateway } from "~tracer-api/domain/session/inbound/ws.gateway.js";
import { errorMessage, logError, logInfo } from "~tracer-api/support/log.js";
import { LocalProjectorModule } from "./local.projector.module.js";
import { TracerApiModule } from "./tracer.api.module.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;
const BODY_LIMIT = "8mb";
const LEDGER_POLL_INTERVAL_MS = 300;
// 플러그인은 수집과 조회를 한 주소로 부르므로 로컬도 게이트웨이가 쓰던 포트 하나로 받는다.
const DEFAULT_ENTRY_PORT = 3847;
const OUTBOX_DRAIN_INTERVAL_MS = 5_000;

/** 브로커가 없는 로컬 프로파일에서 조회 창구의 준비 계약을 유지하려는 관리자 창구다. */
function stubKafka(): ReturnType<typeof createKafka> {
    const admin = {
        connect: (): Promise<void> => Promise.resolve(),
        listTopics: (): Promise<string[]> => Promise.resolve([]),
        disconnect: (): Promise<void> => Promise.resolve(),
    };
    return { admin: () => admin } as unknown as ReturnType<typeof createKafka>;
}

async function bootstrap(): Promise<void> {
    const config = loadApplicationConfig();
    if (config.profile !== SQLITE_PROFILE) {
        throw new Error(`local runtime requires MONITOR_PROFILE=${SQLITE_PROFILE}`);
    }

    // 조회 모델과 원장은 로컬에서도 서로 다른 파일이라 한 경로에서 섞이지 않는다.
    const tracerDataSource = createDataSource({
        db: config.tracerDb,
        entities: [...TRACER_ENTITIES, LocalProjectionCursorEntity],
        migrations: [],
    });
    const ledgerDataSource = createDataSource({ db: config.eventDb, entities: [], migrations: [] });
    await tracerDataSource.initialize();
    await ledgerDataSource.initialize();

    const clock = new SystemClock();
    const broadcaster = new NotificationBroadcaster();
    const gateway = new WsGateway(broadcaster);

    const app = await NestFactory.create<NestExpressApplication>(
        TracerApiModule.forRoot(tracerDataSource, stubKafka(), broadcaster),
        { logger: ["error", "warn"] },
    );
    app.use(helmet());
    app.enableCors({ origin: true, credentials: true });
    app.useBodyParser("json", { limit: BODY_LIMIT });
    app.use(createIngestProxy(`http://127.0.0.1:${config.ingestApi.port}`));
    gateway.attach(app.getHttpServer());

    // 투영은 조회 창구와 같은 프로세스에 살면서 컨테이너만 따로 갖는다.
    const projector = await NestFactory.createApplicationContext(
        LocalProjectorModule.forRoot({
            database: new TypeOrmTracerDatabaseAdapter(tracerDataSource),
            ledgerSource: new SqliteLedgerSourceAdapter(ledgerDataSource),
            cursor: new TypeOrmProjectionCursorAdapter(tracerDataSource),
            broadcaster,
            indexLock: new LocalSearchOutboxLockAdapter(tracerDataSource),
            searchIndex: new NoopSearchIndexAdapter(),
            clock,
        }),
        { logger: ["error", "warn"] },
    );

    const pollLedger = projector.get(LedgerPollConsumer);
    const drainOutbox = projector.get(SearchOutboxDrainUseCase);
    const scheduler = new PeriodicScheduler(clock);
    scheduler.every("ledger_poll", LEDGER_POLL_INTERVAL_MS, () => pollLedger.drain());
    scheduler.every("search_outbox_drain", OUTBOX_DRAIN_INTERVAL_MS, () => drainOutbox.runOnce());

    const host = config.listenHost;
    const port = Number(process.env["MONITOR_LOCAL_PORT"] ?? DEFAULT_ENTRY_PORT);
    await app.listen(port, host);
    logInfo({
        msg: "process.lifecycle.started",
        host,
        port,
        ingestUpstreamPort: config.ingestApi.port,
        driver: "sqlite",
        tracerDbFile: config.tracerDb.file,
        eventDbFile: config.eventDb.file,
        ledgerPollIntervalMs: LEDGER_POLL_INTERVAL_MS,
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
            await scheduler.stopAndDrain();
            await gateway.close();
            await app.close();
            await projector.close();
            await ledgerDataSource.destroy();
            await tracerDataSource.destroy();
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
    logError({ msg: "process.bootstrap.failed", error: errorMessage(error) });
    process.exit(1);
});
