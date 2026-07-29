import { Module, type DynamicModule } from "@nestjs/common";
import type { IClock, KafkaConsumer, KafkaProducer } from "@agent-tracer/platform";
import { ApplyLedgerBatchUseCase } from "~tracer-api/domain/projection/application/apply.ledger.batch.usecase.js";
import { ArrivalProjection } from "~tracer-api/domain/projection/application/arrival.projection.js";
import { RecipeProjection } from "~tracer-api/domain/projection/application/recipe.projection.js";
import { RuleEvaluationProjection } from "~tracer-api/domain/projection/application/rule.evaluation.projection.js";
import { RunProjection } from "~tracer-api/domain/projection/application/run.projection.js";
import { RunSessionProjection } from "~tracer-api/domain/projection/application/run.session.projection.js";
import { RunTaskProjection } from "~tracer-api/domain/projection/application/run.task.projection.js";
import { TimelineProjection } from "~tracer-api/domain/projection/application/timeline.projection.js";
import { DbConsumer } from "~tracer-api/domain/projection/inbound/db.consumer.js";
import { CLOCK } from "~tracer-api/domain/projection/port/clock.port.js";
import { NOTIFICATION_PUBLISHER } from "~tracer-api/domain/projection/port/notification.publisher.port.js";
import { TRACER_DATABASE, type TracerDatabase } from "~tracer-api/domain/projection/port/tracer.database.port.js";
import { KafkaNotificationPublisher } from "~tracer-api/domain/projection/adapter/kafka.notification.publisher.adapter.js";
import { IndexSearchUseCase } from "~tracer-api/domain/index/application/index.search.usecase.js";
import { SearchOutboxDrainUseCase } from "~tracer-api/domain/index/application/search.outbox.drain.usecase.js";
import { SearchConsumer } from "~tracer-api/domain/index/inbound/search.consumer.js";
import { ADVISORY_LOCK as INDEX_ADVISORY_LOCK, type AdvisoryLockPort as IndexAdvisoryLockPort } from "~tracer-api/domain/index/port/advisory.lock.port.js";
import { SEARCH_INDEX_WRITER, type SearchIndexWriterPort } from "~tracer-api/domain/index/port/search.index.writer.port.js";
import type { SearchOutboxDrainRepositories } from "~tracer-api/domain/index/port/search.outbox.drain.repository.port.js";
import { ExportOtlpUseCase } from "~tracer-api/domain/export/application/export.otlp.usecase.js";
import { HttpOtlpExporter } from "~tracer-api/domain/export/adapter/http.otlp.exporter.adapter.js";
import { OtlpConsumer } from "~tracer-api/domain/export/inbound/otlp.consumer.js";
import { OTLP_EXPORTER } from "~tracer-api/domain/export/port/otlp.exporter.port.js";
import {
    DB_EVENT_CONSUMER,
    NOTIFICATION_PRODUCER,
    OTLP_EVENT_CONSUMER,
    OTLP_EXPORT_ENDPOINT,
    SEARCH_EVENT_CONSUMER,
} from "~tracer-api/support/projector.tokens.js";

export interface OtlpExportDeps {
    readonly consumer: KafkaConsumer;
    readonly endpoint: string;
}

export interface ProjectorDeps {
    readonly database: TracerDatabase;
    readonly indexLock: IndexAdvisoryLockPort<SearchOutboxDrainRepositories>;
    readonly producer: KafkaProducer;
    readonly dbEventConsumer: KafkaConsumer;
    readonly searchEventConsumer: KafkaConsumer;
    readonly searchIndex: SearchIndexWriterPort;
    readonly clock: IClock;
    readonly otlp?: OtlpExportDeps | undefined;
}

/** 세 기능 슬라이스의 포트 토큰을 실제 어댑터 인스턴스에 잇는 이 앱의 유일한 배선 지점이다. */
@Module({})
export class ProjectorModule {
    static forRoot(deps: ProjectorDeps): DynamicModule {
        const otlpProviders = deps.otlp
            ? [
                ExportOtlpUseCase,
                OtlpConsumer,
                { provide: OTLP_EXPORTER, useClass: HttpOtlpExporter },
                { provide: OTLP_EVENT_CONSUMER, useValue: deps.otlp.consumer },
                { provide: OTLP_EXPORT_ENDPOINT, useValue: deps.otlp.endpoint },
            ]
            : [];
        return {
            module: ProjectorModule,
            providers: [
                ArrivalProjection,
                RunProjection,
                RunSessionProjection,
                RunTaskProjection,
                TimelineProjection,
                RuleEvaluationProjection,
                RecipeProjection,
                ApplyLedgerBatchUseCase,
                DbConsumer,
                { provide: TRACER_DATABASE, useValue: deps.database },
                { provide: CLOCK, useValue: deps.clock },
                { provide: NOTIFICATION_PUBLISHER, useExisting: KafkaNotificationPublisher },

                KafkaNotificationPublisher,
                { provide: NOTIFICATION_PRODUCER, useValue: deps.producer },

                IndexSearchUseCase,
                SearchOutboxDrainUseCase,
                SearchConsumer,
                { provide: INDEX_ADVISORY_LOCK, useValue: deps.indexLock },
                { provide: SEARCH_INDEX_WRITER, useValue: deps.searchIndex },

                { provide: DB_EVENT_CONSUMER, useValue: deps.dbEventConsumer },
                { provide: SEARCH_EVENT_CONSUMER, useValue: deps.searchEventConsumer },

                ...otlpProviders,
            ],
            exports: [
                DbConsumer,
                SearchConsumer,
                SearchOutboxDrainUseCase,
                ...(deps.otlp ? [OtlpConsumer] : []),
            ],
        };
    }
}
