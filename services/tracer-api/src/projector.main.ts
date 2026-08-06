import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { CONSUMER_GROUP } from "@agent-tracer/kernel";
import { TRACER_ENTITIES } from "@agent-tracer/tracer-model";
import {
    createDataSource,
    createKafka,
    createKafkaConsumer,
    createKafkaReadinessProbe,
    createOpenSearchClient,
    loadApplicationConfig,
    SchemaOutOfDateError,
    SystemClock,
} from "@agent-tracer/platform";
import { TypeOrmTracerDatabaseAdapter } from "~tracer-api/domain/projection/adapter/typeorm.tracer.database.adapter.js";
import { DbConsumer } from "~tracer-api/domain/projection/inbound/db.consumer.js";
import { OpenSearchIndexAdapter } from "~tracer-api/domain/index/adapter/open.search.index.adapter.js";
import { TypeOrmSearchOutboxLockAdapter } from "~tracer-api/domain/index/adapter/typeorm.search.outbox.lock.adapter.js";
import { TypeOrmSplitTaskReaderAdapter } from "~tracer-api/domain/index/adapter/typeorm.split.task.reader.adapter.js";
import { SearchOutboxDrainUseCase } from "~tracer-api/domain/index/application/search.outbox.drain.usecase.js";
import { SearchConsumer } from "~tracer-api/domain/index/inbound/search.consumer.js";
import { OtlpConsumer } from "~tracer-api/domain/export/inbound/otlp.consumer.js";
import { PeriodicScheduler } from "~tracer-api/config/periodic.scheduler.js";
import { loadProjectorRuntimeConfig } from "~tracer-api/config/projector.runtime.config.js";
import { errorMessage, logError, logInfo } from "~tracer-api/support/log.js";
import { startHealthServer } from "~tracer-api/support/health.server.js";
import { ProjectorModule } from "./projector.module.js";

const CONSUMER_MAX_BATCH_SIZE = 100;
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
    const config = loadApplicationConfig();
    const runtimeConfig = loadProjectorRuntimeConfig();

    const clock = new SystemClock();
    const dataSource = createDataSource({ db: config.tracerDb, entities: TRACER_ENTITIES, migrations: [], migrationsRun: false });
    const database = new TypeOrmTracerDatabaseAdapter(dataSource);
    const indexLock = new TypeOrmSearchOutboxLockAdapter(dataSource);
    const splitTasks = new TypeOrmSplitTaskReaderAdapter(dataSource);

    const kafka = createKafka("projector");
    const searchClient = createOpenSearchClient();
    const searchIndex = new OpenSearchIndexAdapter(searchClient);
    const healthServer = startHealthServer(config.projector.port, config.listenHost, database, [
        createKafkaReadinessProbe(kafka),
        searchIndex,
    ]);

    await database.initialize();

    const producer = kafka.producer();
    await producer.connect();
    const dbEventConsumer = createKafkaConsumer(kafka, {
        groupId: CONSUMER_GROUP.projectorDb,
        fromBeginning: true,
        maxBatchSize: CONSUMER_MAX_BATCH_SIZE,
    });
    const searchEventConsumer = createKafkaConsumer(kafka, {
        groupId: CONSUMER_GROUP.projectorSearch,
        fromBeginning: true,
        maxBatchSize: CONSUMER_MAX_BATCH_SIZE,
    });
    // EVENTS_OTLP_ENDPOINT는 이벤트 tee 대상이며 projector 자체 계측 설정과 분리된다.
    const otlp = runtimeConfig.eventsOtlp
        ? {
            endpoint: runtimeConfig.eventsOtlp.endpoint,
            consumer: createKafkaConsumer(kafka, {
                groupId: CONSUMER_GROUP.projectorOtlp,
                fromBeginning: true,
                maxBatchSize: CONSUMER_MAX_BATCH_SIZE,
            }),
        }
        : undefined;

    const app = await NestFactory.createApplicationContext(
        ProjectorModule.forRoot({
            database,
            indexLock,
            splitTasks,
            producer,
            dbEventConsumer,
            searchEventConsumer,
            searchIndex,
            clock,
            otlp,
        }),
        { logger: ["error", "warn"] },
    );

    const dbConsumer = app.get(DbConsumer);
    const searchConsumer = app.get(SearchConsumer);
    const otlpConsumer = otlp ? app.get(OtlpConsumer) : null;
    const searchOutboxDrain = app.get(SearchOutboxDrainUseCase);

    await searchConsumer.ensureIndices();
    await dbConsumer.start();
    await searchConsumer.start();
    if (otlpConsumer) await otlpConsumer.start();
    const scheduler = new PeriodicScheduler(clock);
    scheduler.every("search_outbox_drain", runtimeConfig.searchOutboxDrainIntervalMs, () => searchOutboxDrain.runOnce());
    logInfo({
        msg: "process.lifecycle.started",
        otlpExport: otlp !== undefined,
        consumerGroups: {
            db: CONSUMER_GROUP.projectorDb,
            search: CONSUMER_GROUP.projectorSearch,
            ...(otlp !== undefined ? { otlp: CONSUMER_GROUP.projectorOtlp } : {}),
        },
        consumerMaxBatchSize: CONSUMER_MAX_BATCH_SIZE,
        searchOutboxDrainIntervalMs: runtimeConfig.searchOutboxDrainIntervalMs,
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
            await dbConsumer.stop();
            await searchConsumer.stop();
            if (otlpConsumer) await otlpConsumer.stop();
            await producer.disconnect();
            await app.close();
            await database.destroy();
            await new Promise<void>((resolve) => healthServer.close(() => resolve()));
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
