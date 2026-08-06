import { Inject, Injectable } from "@nestjs/common";
import { TaskSplitService } from "~tracer-api/domain/task/application/task.split.service.js";
import { SPLIT_WRITER, type SplitWriterPort } from "~tracer-api/domain/task/port/split.write.port.js";
import {
    TURN_REASSIGNMENT_REPOSITORY,
    type TurnReassignmentRepositoryPort,
} from "~tracer-api/domain/task/port/turn.reassignment.repository.port.js";

export interface RevertTaskSplitResult {
    readonly taskId: string;
    readonly restoredTurnCount: number;
    readonly taskRemoved: boolean;
}

/** 구간 행을 지워 옮겨 갔던 턴을 원래 태스크로 돌려놓는다. */
@Injectable()
export class RevertTaskSplitUseCase {
    constructor(
        @Inject(TURN_REASSIGNMENT_REPOSITORY) private readonly ranges: TurnReassignmentRepositoryPort,
        @Inject(SPLIT_WRITER) private readonly writer: SplitWriterPort,
        private readonly split: TaskSplitService,
    ) {}

    async execute(userId: string, taskId: string): Promise<RevertTaskSplitResult> {
        const task = await this.split.requireTask(userId, taskId);
        const rows = await this.ranges.findByTask(userId, taskId);
        if (rows.length === 0) return { taskId, restoredTurnCount: 0, taskRemoved: false };

        let restored = 0;
        const touched = new Set<string>([taskId]);
        for (const row of rows) {
            const turnIds = await this.split.moveRange(
                userId,
                row.sessionId,
                row.fromTurnIndex,
                row.toTurnIndex,
                row.originTaskId,
                taskId,
            );
            restored += turnIds.length;
            touched.add(row.originTaskId);
        }
        await this.ranges.deleteByIds(rows.map((row) => row.id));

        // 분리가 만든 태스크는 턴을 다 돌려주면 아무것도 남지 않으므로 지운다.
        const removable = task.splitFromTaskId !== null;
        if (removable) await this.writer.deleteTask(userId, taskId);

        for (const id of touched) await this.split.reindex(userId, id);

        return { taskId, restoredTurnCount: restored, taskRemoved: removable };
    }
}
