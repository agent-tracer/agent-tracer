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
import { DB_EVENT_CONSUMER, NOTIFICATION_PRODUCER } from "~tracer-api/support/projector.tokens.js";

export interface ProjectorDeps {
    readonly database: TracerDatabase;
    readonly producer: KafkaProducer;
    readonly dbEventConsumer: KafkaConsumer;
    readonly clock: IClock;
}

/** 기능 슬라이스의 포트 토큰을 실제 어댑터 인스턴스에 잇는 이 앱의 유일한 배선 지점이다. */
@Module({})
export class ProjectorModule {
    static forRoot(deps: ProjectorDeps): DynamicModule {
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

                { provide: DB_EVENT_CONSUMER, useValue: deps.dbEventConsumer },
            ],
            exports: [DbConsumer],
        };
    }
}
