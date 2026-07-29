import type { TaskUserStateEntity } from "@agent-tracer/tracer-model";
import type { TaskUserStateRepositoryPort } from "~tracer-api/domain/task/port/task.user.state.repository.port.js";

/** 태스크 사용자 상태 포트의 인메모리 대역이다. */
export class InMemoryTaskUserStateRepository implements TaskUserStateRepositoryPort {
    private readonly rows = new Map<string, TaskUserStateEntity>();

    seed(...states: readonly TaskUserStateEntity[]): void {
        for (const state of states) this.rows.set(key(state.userId, state.taskId), state);
    }

    all(): readonly TaskUserStateEntity[] {
        return [...this.rows.values()];
    }

    findById(userId: string, taskId: string): Promise<TaskUserStateEntity | null> {
        return Promise.resolve(this.rows.get(key(userId, taskId)) ?? null);
    }

    save(state: TaskUserStateEntity): Promise<void> {
        this.rows.set(key(state.userId, state.taskId), state);
        return Promise.resolve();
    }
}

function key(userId: string, taskId: string): string {
    return `${userId}\u0000${taskId}`;
}
