import { Inject, Injectable } from "@nestjs/common";
import type { TurnDto, TurnSplitRangeDto, TurnVerdictDto } from "@agent-tracer/kernel";
import { TASK_REPOSITORY, type TaskRepositoryPort } from "~tracer-api/domain/task/port/task.repository.port.js";
import { TURN_READER, type TurnReaderPort } from "~tracer-api/domain/task/port/turn.reader.port.js";
import { VERDICT_READER, type VerdictReaderPort } from "~tracer-api/domain/task/port/verdict.reader.port.js";
import {
    TURN_REASSIGNMENT_REPOSITORY,
    type TurnReassignmentRepositoryPort,
} from "~tracer-api/domain/task/port/turn.reassignment.repository.port.js";

export type { TurnDto, TurnSplitRangeDto, TurnVerdictDto };

@Injectable()
export class ListTurnsUseCase {
    constructor(
        @Inject(TASK_REPOSITORY) private readonly tasks: TaskRepositoryPort,
        @Inject(TURN_READER) private readonly turns: TurnReaderPort,
        @Inject(VERDICT_READER) private readonly verdicts: VerdictReaderPort,
        @Inject(TURN_REASSIGNMENT_REPOSITORY) private readonly ranges: TurnReassignmentRepositoryPort,
    ) {}

    async execute(
        userId: string,
        taskId: string,
    ): Promise<{ readonly items: readonly TurnDto[]; readonly splits: readonly TurnSplitRangeDto[] } | null> {
        const task = await this.tasks.findById(userId, taskId);
        // 남의 작업은 존재 여부도 드러내지 않는다.
        if (task === null) return null;
        const turns = await this.turns.findByTask(userId, taskId);
        const verdicts = await this.verdicts.findByTurns(turns.map((turn) => turn.id));
        const verdictsByTurn = new Map<string, TurnVerdictDto[]>();
        for (const verdict of verdicts) {
            const bucket = verdictsByTurn.get(verdict.turnId);
            const dto = { ruleId: verdict.ruleId, status: verdict.status };
            if (bucket === undefined) verdictsByTurn.set(verdict.turnId, [dto]);
            else bucket.push(dto);
        }
        const items: TurnDto[] = turns.map((turn) => ({
            id: turn.id,
            taskId: turn.taskId,
            sessionId: turn.sessionId,
            turnIndex: turn.turnIndex,
            status: turn.status,
            startedAt: turn.startedAt.toISOString(),
            endedAt: turn.endedAt !== null ? turn.endedAt.toISOString() : null,
            askedText: turn.askedText,
            assistantText: turn.assistantText,
            aggregateVerdict: turn.aggregateVerdict,
            rulesEvaluatedCount: turn.rulesEvaluatedCount,
            verdicts: verdictsByTurn.get(turn.id) ?? [],
        }));
        return { items, splits: await this.splitRanges(userId, taskId) };
    }

    /** 원본 태스크의 피드는 턴 인덱스가 뛰는 자리를 이 구간으로 설명한다. */
    private async splitRanges(userId: string, taskId: string): Promise<readonly TurnSplitRangeDto[]> {
        const rows = await this.ranges.findByOriginTask(userId, taskId);
        return rows.map((row) => ({
            fromTurnIndex: row.fromTurnIndex,
            toTurnIndex: row.toTurnIndex,
            taskId: row.taskId,
            movedAt: row.movedAt.toISOString(),
        }));
    }
}
