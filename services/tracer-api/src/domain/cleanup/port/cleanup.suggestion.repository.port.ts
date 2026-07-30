import type { TaskCleanupSuggestionKind, TaskCleanupSuggestionStatus } from "@agent-tracer/kernel";
import type { TaskCleanupSuggestionEntity } from "@agent-tracer/tracer-model";

export const CLEANUP_SUGGESTION_REPOSITORY = Symbol("CleanupSuggestionRepository");

/** 정리 제안 애그리게이트의 조회와 저장을 제공하는 애플리케이션 포트다. */
export interface CleanupSuggestionRepositoryPort {
    findById(id: string): Promise<TaskCleanupSuggestionEntity | null>;
    findByUserStatus(userId: string, status: TaskCleanupSuggestionStatus): Promise<TaskCleanupSuggestionEntity[]>;
    findPendingByUserTaskIds(
        userId: string,
        taskIds: readonly string[],
        kind: TaskCleanupSuggestionKind,
    ): Promise<TaskCleanupSuggestionEntity[]>;
    upsert(suggestion: TaskCleanupSuggestionEntity): Promise<void>;
}
