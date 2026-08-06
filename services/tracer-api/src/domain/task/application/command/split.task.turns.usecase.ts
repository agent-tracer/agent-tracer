import { Inject, Injectable } from "@nestjs/common";
import {
    planRangeInsert,
    TaskEntity,
    TurnReassignmentEntity,
    type StoredRange,
} from "@agent-tracer/tracer-model";
import { TaskSplitService } from "~tracer-api/domain/task/application/task.split.service.js";
import { CLOCK, type ClockPort } from "~tracer-api/domain/task/port/clock.port.js";
import { TASK_ID_GENERATOR, type TaskIdGeneratorPort } from "~tracer-api/domain/task/port/task.id.generator.port.js";
import { TASK_REPOSITORY, type TaskRepositoryPort } from "~tracer-api/domain/task/port/task.repository.port.js";
import {
    TURN_REASSIGNMENT_REPOSITORY,
    type TurnReassignmentRepositoryPort,
} from "~tracer-api/domain/task/port/turn.reassignment.repository.port.js";

/** 옮길 구간과 받을 태스크를 정한 분리 명령이다. */
export interface SplitTaskTurnsCommand {
    readonly sessionId: string;
    readonly fromTurnIndex: number;
    readonly toTurnIndex: number;
    readonly newTitle?: string | undefined;
    readonly targetTaskId?: string | undefined;
}

export interface SplitTaskTurnsResult {
    readonly originTaskId: string;
    readonly taskId: string;
    readonly title: string;
    readonly created: boolean;
    readonly movedTurnCount: number;
}

function toStoredRange(row: TurnReassignmentEntity): StoredRange {
    return {
        id: row.id,
        fromTurnIndex: row.fromTurnIndex,
        toTurnIndex: row.toTurnIndex,
        taskId: row.taskId,
        originTaskId: row.originTaskId,
    };
}

/** 끝난 세션의 턴 구간만 다른 태스크로 옮기며, 구간 밖의 턴은 손대지 않아 원본이 쪼개지지 않는다. */
@Injectable()
export class SplitTaskTurnsUseCase {
    constructor(
        @Inject(TASK_REPOSITORY) private readonly tasks: TaskRepositoryPort,
        @Inject(TURN_REASSIGNMENT_REPOSITORY) private readonly ranges: TurnReassignmentRepositoryPort,
        @Inject(TASK_ID_GENERATOR) private readonly ids: TaskIdGeneratorPort,
        @Inject(CLOCK) private readonly clock: ClockPort,
        private readonly split: TaskSplitService,
    ) {}

    async execute(userId: string, taskId: string, command: SplitTaskTurnsCommand): Promise<SplitTaskTurnsResult> {
        const origin = await this.split.requireTask(userId, taskId);
        await this.split.requireEndedSession(userId, taskId, command.sessionId);

        const now = this.clock.now();
        const { target, created } = await this.resolveTarget(userId, origin, command, now);

        await this.saveRange(userId, command, target.id, taskId, now);
        const movedTurnIds = await this.split.moveRange(
            userId,
            command.sessionId,
            command.fromTurnIndex,
            command.toTurnIndex,
            target.id,
            taskId,
        );

        await this.split.reindex(userId, target.id);
        await this.split.reindex(userId, taskId);

        return {
            originTaskId: taskId,
            taskId: target.id,
            title: target.title,
            created,
            movedTurnCount: movedTurnIds.length,
        };
    }

    private async resolveTarget(
        userId: string,
        origin: TaskEntity,
        command: SplitTaskTurnsCommand,
        now: Date,
    ): Promise<{ readonly target: TaskEntity; readonly created: boolean }> {
        if (command.targetTaskId !== undefined) {
            return { target: await this.split.requireTask(userId, command.targetTaskId), created: false };
        }
        const target = TaskEntity.splitFrom(this.ids.next(), origin, command.newTitle ?? origin.title, now);
        await this.tasks.upsert(target);
        return { target, created: true };
    }

    /** 조회가 배치마다 도는 경로라 우선순위 판정 대신 저장 시점에 겹침을 없앤다. */
    private async saveRange(
        userId: string,
        command: SplitTaskTurnsCommand,
        targetTaskId: string,
        originTaskId: string,
        now: Date,
    ): Promise<void> {
        const existing = await this.ranges.findBySession(userId, command.sessionId);
        const plan = planRangeInsert(existing.map(toStoredRange), {
            fromTurnIndex: command.fromTurnIndex,
            toTurnIndex: command.toTurnIndex,
            taskId: targetTaskId,
            originTaskId,
        });

        await this.ranges.deleteByIds(plan.removedIds);

        const byId = new Map(existing.map((row) => [row.id, row]));
        const rows: TurnReassignmentEntity[] = [];
        for (const range of plan.updated) {
            const row = byId.get(range.id);
            if (row === undefined) continue;
            row.fromTurnIndex = range.fromTurnIndex;
            row.toTurnIndex = range.toTurnIndex;
            rows.push(row);
        }
        for (const draft of plan.created) {
            rows.push(
                TurnReassignmentEntity.create({
                    id: this.ids.next(),
                    userId,
                    sessionId: command.sessionId,
                    fromTurnIndex: draft.fromTurnIndex,
                    toTurnIndex: draft.toTurnIndex,
                    taskId: draft.taskId,
                    originTaskId: draft.originTaskId,
                    movedAt: now,
                }),
            );
        }
        await this.ranges.upsertAll(rows);
    }
}
