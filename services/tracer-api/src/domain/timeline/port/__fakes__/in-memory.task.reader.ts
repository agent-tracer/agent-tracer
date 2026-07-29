import type { TaskEntity } from "@agent-tracer/tracer-model";
import type { TimelineTaskReaderPort } from "../task.reader.port.js";

/** 태스크 읽기 포트의 인메모리 대역이다. */
export class InMemoryTimelineTaskReader implements TimelineTaskReaderPort {
    private readonly rows = new Map<string, TaskEntity>();

    seed(...tasks: readonly TaskEntity[]): void {
        for (const task of tasks) this.rows.set(key(task.userId, task.id), task);
    }

    all(): readonly TaskEntity[] {
        return [...this.rows.values()];
    }

    findById(userId: string, id: string): Promise<TaskEntity | null> {
        return Promise.resolve(this.rows.get(key(userId, id)) ?? null);
    }
}

function key(userId: string, taskId: string): string {
    return `${userId}\u0000${taskId}`;
}
