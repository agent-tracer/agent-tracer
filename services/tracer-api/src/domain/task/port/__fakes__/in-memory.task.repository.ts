import { TaskView, type TaskEntity, type TaskPageFilter, type TaskUserStateEntity } from "@agent-tracer/tracer-model";
import type { TaskRepositoryPort } from "~tracer-api/domain/task/port/task.repository.port.js";

/** 태스크 저장소 포트의 인메모리 대역이다. */
export class InMemoryTaskRepository implements TaskRepositoryPort {
    private readonly rows = new Map<string, TaskEntity>();
    private readonly userStates = new Map<string, TaskUserStateEntity>();
    lastPageFilter: TaskPageFilter | null = null;
    visiblePageQueryCount = 0;

    seed(...tasks: readonly TaskEntity[]): void {
        for (const task of tasks) this.rows.set(key(task.userId, task.id), task);
    }

    seedUserStates(...states: readonly TaskUserStateEntity[]): void {
        for (const state of states) this.userStates.set(key(state.userId, state.taskId), state);
    }

    all(): readonly TaskEntity[] {
        return [...this.rows.values()];
    }

    findById(userId: string, id: string): Promise<TaskEntity | null> {
        return Promise.resolve(this.rows.get(key(userId, id)) ?? null);
    }

    findChildren(userId: string, taskId: string): Promise<TaskEntity[]> {
        return Promise.resolve(this.all().filter((task) => task.userId === userId && task.parentTaskId === taskId));
    }

    findDescendantIds(rootId: string, userId: string): Promise<string[]> {
        const out: string[] = [];
        const seen = new Set<string>([rootId]);
        const queue = [rootId];
        while (queue.length > 0) {
            const parentId = queue.shift()!;
            for (const task of this.all()) {
                if (task.parentTaskId !== parentId) continue;
                if (task.userId !== userId) continue;
                if (seen.has(task.id)) continue;
                seen.add(task.id);
                out.push(task.id);
                queue.push(task.id);
            }
        }
        return Promise.resolve(out);
    }

    findPage(userId: string, filter: TaskPageFilter): Promise<TaskEntity[]> {
        this.lastPageFilter = filter;
        const rows = this.all()
            .filter((task) => task.userId === userId)
            .filter((task) => filter.parentTaskId === undefined || task.parentTaskId === filter.parentTaskId)
            .filter((task) => filter.status === undefined || task.status === filter.status)
            .filter((task) => filter.origin === undefined || task.origin === filter.origin)
            .filter((task) => filter.rootOnly !== true || task.parentTaskId === null);
        return Promise.resolve(rows.slice(0, filter.limit));
    }

    countVisible(userId: string, filter: TaskPageFilter): Promise<number> {
        // 커서와 페이지 상한만 무시하고 나머지 필터는 페이지 조회와 같게 센다.
        const { cursor: _cursor, ...rest } = filter;
        return this.matching(userId, { ...rest, limit: Number.MAX_SAFE_INTEGER }).then((rows) => rows.length);
    }

    findVisiblePage(userId: string, filter: TaskPageFilter): Promise<TaskView[]> {
        this.lastPageFilter = filter;
        this.visiblePageQueryCount += 1;
        return this.matching(userId, filter);
    }

    private matching(userId: string, filter: TaskPageFilter): Promise<TaskView[]> {
        const rows = this.all()
            .filter((task) => task.userId === userId)
            .filter((task) => filter.parentTaskId === undefined || task.parentTaskId === filter.parentTaskId)
            .filter((task) => filter.status === undefined || task.status === filter.status)
            .filter((task) => filter.origin === undefined || task.origin === filter.origin)
            .filter((task) => filter.rootOnly !== true || task.parentTaskId === null)
            .filter(
                (task) =>
                    filter.cursor === undefined ||
                    task.updatedAt.toISOString() < filter.cursor.updatedAt ||
                    (task.updatedAt.toISOString() === filter.cursor.updatedAt && task.id < filter.cursor.id),
            )
            .map((task) => {
                const state = this.userStates.get(key(userId, task.id)) ?? null;
                return { task, state, view: new TaskView(task, state) };
            })
            .filter(({ view }) => view.isVisible())
            .filter(({ view }) => filter.archived === undefined || view.isArchived() === filter.archived)
            .sort((a, b) => b.task.updatedAt.getTime() - a.task.updatedAt.getTime() || b.task.id.localeCompare(a.task.id))
            .slice(0, filter.limit)
            .map(({ view }) => view);
        return Promise.resolve(rows);
    }

    upsert(task: TaskEntity): Promise<void> {
        this.rows.set(key(task.userId, task.id), task);
        return Promise.resolve();
    }
}

function key(userId: string, taskId: string): string {
    return `${userId}\u0000${taskId}`;
}
