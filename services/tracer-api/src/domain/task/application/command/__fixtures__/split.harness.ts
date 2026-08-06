import { SESSION_STATUS, SessionEntity, TaskEntity, type SessionStatus } from "@agent-tracer/tracer-model";
import { RevertTaskSplitUseCase } from "~tracer-api/domain/task/application/command/revert.task.split.usecase.js";
import { SplitTaskTurnsUseCase } from "~tracer-api/domain/task/application/command/split.task.turns.usecase.js";
import { TaskSplitService } from "~tracer-api/domain/task/application/task.split.service.js";
import { FixedClock } from "~tracer-api/domain/task/port/__fakes__/fixed.clock.js";
import { InMemorySessionReader } from "~tracer-api/domain/task/port/__fakes__/in-memory.session.reader.js";
import { InMemorySplitWriter } from "~tracer-api/domain/task/port/__fakes__/in-memory.split.writer.js";
import { InMemoryTaskSearchIndex } from "~tracer-api/domain/task/port/__fakes__/in-memory.task.search.index.js";
import { InMemoryTaskRepository } from "~tracer-api/domain/task/port/__fakes__/in-memory.task.repository.js";
import { InMemoryTaskUserStateRepository } from "~tracer-api/domain/task/port/__fakes__/in-memory.task.user.state.repository.js";
import { InMemoryVerdictRealigner } from "~tracer-api/domain/task/port/__fakes__/in-memory.verdict.realigner.js";
import { InMemoryTurnReassignmentRepository } from "~tracer-api/domain/task/port/__fakes__/in-memory.turn.reassignment.repository.js";

export const NOW = new Date("2026-01-01T00:00:00.000Z");
export const USER = "u1";
export const ORIGIN_TASK = "task-A";
export const SESSION = "session-1";

export function makeTask(id: string, overrides: Partial<TaskEntity> = {}): TaskEntity {
    const task = new TaskEntity();
    task.id = id;
    task.userId = USER;
    task.title = id;
    task.titleRank = "auto";
    task.slug = id;
    task.workspacePath = "/w";
    task.status = "completed";
    task.taskKind = "primary";
    task.origin = "user";
    task.cliSource = "claude-code";
    task.parentTaskId = null;
    task.parentSessionId = null;
    task.backgroundOfTaskId = null;
    task.splitFromTaskId = null;
    task.createdAt = NOW;
    task.updatedAt = NOW;
    task.lastSessionStartedAt = null;
    task.lastEventAt = null;
    task.lastAppliedSeq = null;
    Object.assign(task, overrides);
    return task;
}

export function makeSession(status: SessionStatus = SESSION_STATUS.ended, taskId = ORIGIN_TASK): SessionEntity {
    const session = new SessionEntity();
    session.id = SESSION;
    session.userId = USER;
    session.taskId = taskId;
    session.runtimeSource = "claude-code";
    session.runtimeSessionId = "rt-1";
    session.status = status;
    session.summary = null;
    session.startedAt = NOW;
    session.endedAt = status === SESSION_STATUS.ended ? NOW : null;
    return session;
}

/** 순번이 정해진 id 생성기라 테스트가 만들어질 태스크 id를 미리 안다. */
export class SequenceIds {
    private counter = 0;

    next(): string {
        this.counter += 1;
        return `id-${this.counter}`;
    }
}

export function makeSplitHarness(args: {
    readonly tasks?: readonly TaskEntity[];
    readonly sessionStatus?: SessionStatus;
    readonly turnIdsByIndex?: ReadonlyMap<number, string>;
} = {}) {
    const tasks = new InMemoryTaskRepository();
    tasks.seed(...(args.tasks ?? [makeTask(ORIGIN_TASK)]));

    const sessions = new InMemorySessionReader();
    sessions.seed(makeSession(args.sessionStatus ?? SESSION_STATUS.ended));

    const ranges = new InMemoryTurnReassignmentRepository();
    const writer = new InMemorySplitWriter();
    if (args.turnIdsByIndex !== undefined) writer.turnIdsByIndex = new Map(args.turnIdsByIndex);
    writer.onDeleteTask = (userId, taskId) => tasks.remove(userId, taskId);

    const search = new InMemoryTaskSearchIndex();
    const taskStates = new InMemoryTaskUserStateRepository();
    const realigner = new InMemoryVerdictRealigner();
    const service = new TaskSplitService(tasks, sessions, writer, search, taskStates, realigner);
    const ids = new SequenceIds();
    const clock = new FixedClock(NOW);

    return {
        tasks,
        sessions,
        ranges,
        writer,
        search,
        realigner,
        split: new SplitTaskTurnsUseCase(tasks, ranges, ids, clock, service),
        revert: new RevertTaskSplitUseCase(ranges, writer, service),
    };
}
