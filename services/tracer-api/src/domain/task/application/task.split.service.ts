import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { SESSION_STATUS, type SessionEntity, type TaskEntity } from "@agent-tracer/tracer-model";
import { SESSION_READER, type SessionReaderPort } from "~tracer-api/domain/task/port/session.reader.port.js";
import { SPLIT_WRITER, type SplitWriterPort } from "~tracer-api/domain/task/port/split.write.port.js";
import { TASK_REPOSITORY, type TaskRepositoryPort } from "~tracer-api/domain/task/port/task.repository.port.js";
import {
    TASK_SEARCH_INDEX,
    type TaskSearchIndexPort,
} from "~tracer-api/domain/task/port/task.search.index.port.js";
import {
    TASK_USER_STATE_REPOSITORY,
    type TaskUserStateRepositoryPort,
} from "~tracer-api/domain/task/port/task.user.state.repository.port.js";
import {
    VERDICT_REALIGNER,
    type VerdictRealignerPort,
} from "~tracer-api/domain/task/port/verdict.realigner.port.js";
import { buildTaskDocument } from "~tracer-api/support/task.document.js";

/** 분리와 되돌리기가 함께 쓰는 검사와 후속 갱신이며, 유스케이스가 유스케이스를 못 부르므로 서비스로 둔다. */
@Injectable()
export class TaskSplitService {
    constructor(
        @Inject(TASK_REPOSITORY) private readonly tasks: TaskRepositoryPort,
        @Inject(SESSION_READER) private readonly sessions: SessionReaderPort,
        @Inject(SPLIT_WRITER) private readonly writer: SplitWriterPort,
        @Inject(TASK_SEARCH_INDEX) private readonly search: TaskSearchIndexPort,
        @Inject(TASK_USER_STATE_REPOSITORY) private readonly taskStates: TaskUserStateRepositoryPort,
        @Inject(VERDICT_REALIGNER) private readonly verdicts: VerdictRealignerPort,
    ) {}

    async requireTask(userId: string, taskId: string): Promise<TaskEntity> {
        const task = await this.tasks.findById(userId, taskId);
        // 남의 태스크는 존재 자체를 알리지 않는다.
        if (task === null) throw new NotFoundException("Task not found");
        return task;
    }

    /** 서버가 옮겨도 터미널은 원본 태스크를 계속 붙잡고 있으므로 살아 있는 세션은 자르지 않는다. */
    async requireEndedSession(userId: string, taskId: string, sessionId: string): Promise<SessionEntity> {
        const session = await this.sessions.findById(sessionId);
        if (session === null || session.userId !== userId) throw new NotFoundException("Session not found");
        if (session.taskId !== taskId) throw new NotFoundException("Session not found");
        if (session.status !== SESSION_STATUS.ended) {
            throw new ConflictException("Session is still running; split after it ends");
        }
        return session;
    }

    /** 옮긴 턴을 따라 이벤트·자식 태스크·규칙 anchor를 함께 옮기고 양쪽 태스크를 다시 센다. */
    async moveRange(
        userId: string,
        sessionId: string,
        fromTurnIndex: number,
        toTurnIndex: number,
        targetTaskId: string,
        originTaskId: string,
    ): Promise<readonly string[]> {
        const turnIds = await this.writer.moveTurns(userId, sessionId, fromTurnIndex, toTurnIndex, targetTaskId);
        if (turnIds.length > 0) {
            await this.writer.moveChildTasks(userId, turnIds, targetTaskId);
            await this.writer.moveRuleAnchors(userId, turnIds, targetTaskId);
        }
        await this.writer.refreshTaskActivity(userId, [originTaskId, targetTaskId]);
        await this.verdicts.realign(userId, turnIds, [originTaskId, targetTaskId]);
        return turnIds;
    }

    async reindex(userId: string, taskId: string): Promise<void> {
        const task = await this.tasks.findById(userId, taskId);
        if (task === null) {
            await this.search.removeTask(userId, taskId);
            return;
        }
        const archived = (await this.taskStates.findById(userId, taskId))?.isArchived() ?? false;
        await this.search.indexTask(userId, taskId, buildTaskDocument(task, archived));
    }
}
