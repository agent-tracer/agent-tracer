import type { TaskSearchIndexPort } from "~tracer-api/domain/task/port/task.search.index.port.js";

/** 태스크 검색 색인 포트의 인메모리 대역이다. */
export class InMemoryTaskSearchIndex implements TaskSearchIndexPort {
    readonly updates: Record<string, unknown>[] = [];
    readonly indexed: string[] = [];
    readonly removed: string[] = [];

    partialUpdate(userId: string, taskId: string, doc: Record<string, unknown>): Promise<void> {
        this.updates.push({ userId, taskId, ...doc });
        return Promise.resolve();
    }

    indexTask(_userId: string, taskId: string): Promise<void> {
        this.indexed.push(taskId);
        return Promise.resolve();
    }

    removeTask(_userId: string, taskId: string): Promise<void> {
        this.removed.push(taskId);
        return Promise.resolve();
    }
}
