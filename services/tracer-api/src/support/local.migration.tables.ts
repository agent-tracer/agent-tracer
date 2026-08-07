import {
    MemoEntity,
    RecipeEntity,
    RuleEntity,
    TagEntity,
    TaskCleanupSuggestionEntity,
    TaskTagEntity,
    TaskUserStateEntity,
    TurnReassignmentEntity,
    UserEntity,
} from "@agent-tracer/tracer-model";

/**
 * 원장 재생으로 되살아나지 않아 그대로 옮겨야 하는 엔티티다.
 */
export const USER_OWNED_ENTITIES = [
    UserEntity,
    TagEntity,
    TaskTagEntity,
    RecipeEntity,
    RuleEntity,
    MemoEntity,
    TaskUserStateEntity,
    TaskCleanupSuggestionEntity,
    TurnReassignmentEntity,
];

/** 분리가 만든 태스크는 원장에 없어 재생으로 되살아나지 않으므로 따로 담는 자리다. */
export const SPLIT_TASK_TABLE = "split_tasks";

/** 이관 꾸러미가 담는 테이블별 행 목록이다. */
export interface LocalStateBundle {
    readonly tables: Record<string, Record<string, unknown>[]>;
}

/** 원장 한 행을 인제스트 요청 봉투로 되돌린 모양이다. */
export interface ReplayEvent {
    readonly id: string;
    readonly kind: string;
    readonly taskId: string;
    readonly sessionId?: string;
    readonly parentId?: string;
    readonly turnId?: string;
    readonly occurredAt: string;
    readonly payload: Record<string, unknown>;
}
