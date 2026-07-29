import type { TaskEntity, TaskPageFilter, TaskView } from "@agent-tracer/tracer-model";

export const TASK_REPOSITORY = Symbol("TaskRepository");

/** 태스크 애그리게이트의 조회와 저장을 제공하는 애플리케이션 포트다. */
export interface TaskRepositoryPort {
    findById(userId: string, id: string): Promise<TaskEntity | null>;
    findChildren(userId: string, taskId: string): Promise<TaskEntity[]>;
    /** rootId 자신을 뺀, 그 아래 모든 깊이의 자손 중 userId 소유인 것들의 id다. */
    findDescendantIds(rootId: string, userId: string): Promise<string[]>;
    findPage(userId: string, filter: TaskPageFilter): Promise<TaskEntity[]>;
    findVisiblePage(userId: string, filter: TaskPageFilter): Promise<TaskView[]>;
    countVisible(userId: string, filter: TaskPageFilter): Promise<number>;
    upsert(task: TaskEntity): Promise<void>;
}
