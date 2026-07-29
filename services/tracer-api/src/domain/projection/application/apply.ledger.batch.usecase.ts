import { Inject, Injectable } from "@nestjs/common";
import {
    CONVERSATION_EVENT_KINDS,
    KIND,
    NOTIFICATION_TYPE,
    RUN_EVENT_KINDS,
    TIMELINE_EVENT_KINDS,
    type NotificationEnvelope,
} from "@agent-tracer/kernel";
import { ArrivalProjection, type ArrivalCoalesced } from "~tracer-api/domain/projection/application/arrival.projection.js";
import { RecipeProjection } from "~tracer-api/domain/projection/application/recipe.projection.js";
import { RuleEvaluationProjection } from "~tracer-api/domain/projection/application/rule.evaluation.projection.js";
import { RunProjection } from "~tracer-api/domain/projection/application/run.projection.js";
import { TimelineProjection } from "~tracer-api/domain/projection/application/timeline.projection.js";
import { CLOCK, type IClock } from "~tracer-api/domain/projection/port/clock.port.js";
import {
    NOTIFICATION_PUBLISHER,
    type NotificationPublisherPort,
} from "~tracer-api/domain/projection/port/notification.publisher.port.js";
import type { LedgerProjectionRepositories } from "~tracer-api/domain/projection/port/projection.repositories.port.js";
import { TRACER_DATABASE, type TracerDatabase } from "~tracer-api/domain/projection/port/tracer.database.port.js";
import { taskNotification } from "~tracer-api/support/notification.factory.js";
import { recordApplied } from "~tracer-api/support/metrics.js";
import { errorMessage, logError, logInfo } from "~tracer-api/support/log.js";
import type { LedgerRecord } from "~tracer-api/support/ledger.record.js";

const RUN_KIND_SET = new Set<string>(RUN_EVENT_KINDS);
const CONVERSATION_KIND_SET = new Set<string>(CONVERSATION_EVENT_KINDS);
const TIMELINE_KIND_SET = new Set<string>(TIMELINE_EVENT_KINDS);

/** 원장 배치를 한 트랜잭션으로 투영하고, 커밋 뒤 알림과 계측을 발행하는 이 슬라이스의 유일한 진입점이다. */
@Injectable()
export class ApplyLedgerBatchUseCase {
    constructor(
        @Inject(TRACER_DATABASE) private readonly database: TracerDatabase,
        private readonly run: RunProjection,
        private readonly timeline: TimelineProjection,
        private readonly ruleEvaluation: RuleEvaluationProjection,
        private readonly recipe: RecipeProjection,
        private readonly arrival: ArrivalProjection,
        @Inject(NOTIFICATION_PUBLISHER) private readonly notifier: NotificationPublisherPort,
        @Inject(CLOCK) private readonly clock: IClock,
    ) {}

    async execute(records: Iterable<LedgerRecord>, recordProjected: () => Promise<void>): Promise<void> {
        const notifications: NotificationEnvelope[] = [];
        const applied: LedgerRecord[] = [];
        const arrivals = new Map<string, ArrivalCoalesced>();
        const startedAt = this.clock.nowMs();

        await this.database.withTransaction(async (repositories) => {
            for (const record of records) {
                try {
                    notifications.push(...await this.projectRecord(repositories, record, arrivals));
                } catch (error) {
                    logError({
                        msg: "ledger.batch_record.failed",
                        eventId: record.id,
                        kind: record.kind,
                        taskId: record.taskId,
                        seq: record.seq,
                        error: errorMessage(error),
                    });
                    throw error;
                }
                applied.push(record);
                await recordProjected();
            }
            const changedTasks = await this.arrival.projectBatch(repositories, arrivals);
            notifications.push(...changedTasks.map((task) => taskNotification(NOTIFICATION_TYPE.taskUpdated, task)));
        });

        logInfo({
            msg: "ledger.batch.applied",
            count: applied.length,
            seqFrom: applied[0]?.seq ?? null,
            seqTo: applied[applied.length - 1]?.seq ?? null,
            durationMs: this.clock.nowMs() - startedAt,
        });
        for (const record of applied) recordApplied("db", record);
        for (const envelope of notifications) await this.notifier.publish(envelope);
    }

    private async projectRecord(
        repositories: LedgerProjectionRepositories,
        record: LedgerRecord,
        arrivals: Map<string, ArrivalCoalesced>,
    ): Promise<NotificationEnvelope[]> {
        const notifications = await this.dispatchByKind(repositories, record);
        this.arrival.merge(arrivals, record);
        return notifications;
    }

    private async dispatchByKind(
        repositories: LedgerProjectionRepositories,
        record: LedgerRecord,
    ): Promise<NotificationEnvelope[]> {
        const kind = record.kind;
        const notifications: NotificationEnvelope[] = [];

        if (RUN_KIND_SET.has(kind)) {
            notifications.push(...await this.run.project(repositories, record));
        } else if (kind === KIND.recipeInjected) {
            await this.recipe.projectInjected(repositories, record);
        } else if (kind === KIND.tokenUsage) {
            await this.timeline.project(repositories, record, false);
        } else if (CONVERSATION_KIND_SET.has(kind)) {
            const result = await this.timeline.project(repositories, record, true);
            notifications.push(...result.notifications);
            if (result.closedTurn !== null) {
                notifications.push(...await this.ruleEvaluation.project(
                    repositories,
                    result.closedTurn,
                    record.userId,
                    record.occurredAt,
                ));
            }
        } else if (TIMELINE_KIND_SET.has(kind)) {
            const result = await this.timeline.project(repositories, record, true);
            notifications.push(...result.notifications);
        } else {
            logError({ msg: "ledger.kind.unhandled", kind, taskId: record.taskId, eventId: record.id });
        }

        return notifications;
    }
}
