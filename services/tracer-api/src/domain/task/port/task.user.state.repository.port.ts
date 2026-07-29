import type { TaskUserStateEntity } from "@agent-tracer/tracer-model";

export const TASK_USER_STATE_REPOSITORY = Symbol("TaskUserStateRepository");

/** 사용자별 태스크 상태의 조회와 저장을 제공하는 애플리케이션 포트다. */
export interface TaskUserStateRepositoryPort {
    findById(userId: string, taskId: string): Promise<TaskUserStateEntity | null>;
    save(state: TaskUserStateEntity): Promise<void>;
}
