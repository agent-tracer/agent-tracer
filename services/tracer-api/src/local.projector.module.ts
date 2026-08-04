import { Module, type DynamicModule } from "@nestjs/common";
import type { IClock } from "@agent-tracer/platform";
import { ApplyLedgerBatchUseCase } from "~tracer-api/domain/projection/application/apply.ledger.batch.usecase.js";
import { ArrivalProjection } from "~tracer-api/domain/projection/application/arrival.projection.js";
import { RecipeProjection } from "~tracer-api/domain/projection/application/recipe.projection.js";
import { RuleEvaluationProjection } from "~tracer-api/domain/projection/application/rule.evaluation.projection.js";
import { RunProjection } from "~tracer-api/domain/projection/application/run.projection.js";
import { RunSessionProjection } from "~tracer-api/domain/projection/application/run.session.projection.js";
import { RunTaskProjection } from "~tracer-api/domain/projection/application/run.task.projection.js";
import { TimelineProjection } from "~tracer-api/domain/projection/application/timeline.projection.js";
import { CLOCK } from "~tracer-api/domain/projection/port/clock.port.js";
import { LedgerPollConsumer } from "~tracer-api/domain/projection/inbound/ledger.poll.consumer.js";
import type { LedgerSource, ProjectionCursorStore } from "~tracer-api/support/ledger.source.js";
import { LEDGER_SOURCE, PROJECTION_CURSOR } from "~tracer-api/support/projector.tokens.js";
import { NOTIFICATION_PUBLISHER } from "~tracer-api/domain/projection/port/notification.publisher.port.js";
import { TRACER_DATABASE, type TracerDatabase } from "~tracer-api/domain/projection/port/tracer.database.port.js";
import { InProcessNotificationPublisher } from "~tracer-api/domain/projection/adapter/in.process.notification.publisher.adapter.js";
import { SearchOutboxDrainUseCase } from "~tracer-api/domain/index/application/search.outbox.drain.usecase.js";
import {
    ADVISORY_LOCK as INDEX_ADVISORY_LOCK,
    type AdvisoryLockPort as IndexAdvisoryLockPort,
} from "~tracer-api/domain/index/port/advisory.lock.port.js";
import {
    SEARCH_INDEX_WRITER,
    type SearchIndexWriterPort,
} from "~tracer-api/domain/index/port/search.index.writer.port.js";
import type { SearchOutboxDrainRepositories } from "~tracer-api/domain/index/port/search.outbox.drain.repository.port.js";
import { NotificationBroadcaster } from "~tracer-api/config/notification.broadcaster.js";

export interface LocalProjectorDeps {
    readonly database: TracerDatabase;
    readonly ledgerSource: LedgerSource;
    readonly cursor: ProjectionCursorStore;
    readonly broadcaster: NotificationBroadcaster;
    readonly indexLock: IndexAdvisoryLockPort<SearchOutboxDrainRepositories>;
    readonly searchIndex: SearchIndexWriterPort;
    readonly clock: IClock;
}

/** 브로커와 검색 엔진 없이 원장 폴링과 인메모리 알림만으로 투영을 세우는 조립 지점이다. */
@Module({})
export class LocalProjectorModule {
    static forRoot(deps: LocalProjectorDeps): DynamicModule {
        return {
            module: LocalProjectorModule,
            providers: [
                ArrivalProjection,
                RunProjection,
                RunSessionProjection,
                RunTaskProjection,
                TimelineProjection,
                RuleEvaluationProjection,
                RecipeProjection,
                ApplyLedgerBatchUseCase,
                LedgerPollConsumer,
                SearchOutboxDrainUseCase,
                InProcessNotificationPublisher,
                { provide: TRACER_DATABASE, useValue: deps.database },
                { provide: CLOCK, useValue: deps.clock },
                { provide: LEDGER_SOURCE, useValue: deps.ledgerSource },
                { provide: PROJECTION_CURSOR, useValue: deps.cursor },
                { provide: NotificationBroadcaster, useValue: deps.broadcaster },
                { provide: NOTIFICATION_PUBLISHER, useExisting: InProcessNotificationPublisher },
                { provide: INDEX_ADVISORY_LOCK, useValue: deps.indexLock },
                { provide: SEARCH_INDEX_WRITER, useValue: deps.searchIndex },
            ],
            exports: [LedgerPollConsumer, SearchOutboxDrainUseCase],
        };
    }
}
