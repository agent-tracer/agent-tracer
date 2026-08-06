import type {
    MemoEntity,
    RecipeEntity,
    SearchOutboxEntity,
    TaskEntity,
    TaskUserStateEntity,
} from "@agent-tracer/tracer-model";

/** 검색 반영 요청 큐를 배출자가 읽고 지우는 포트다. */
export interface SearchOutboxRepositoryPort {
    findBatch(limit: number): Promise<SearchOutboxEntity[]>;
    delete(id: string): Promise<void>;
    markFailed(id: string, attempts: number, error: string): Promise<void>;
}

/** 배출 시점의 레시피 본문을 다시 읽는 포트다. */
export interface SearchOutboxRecipeRepository {
    findById(id: string): Promise<RecipeEntity | null>;
}

/** 배출 시점의 태스크 사용자 상태를 다시 읽는 포트다. */
export interface SearchOutboxTaskUserStateRepository {
    findById(userId: string, taskId: string): Promise<TaskUserStateEntity | null>;
}

/** 배출 시점의 태스크 본문을 다시 읽는 포트이며, 분리 태스크는 색인 문서가 없어 부분 갱신 대신 전체 색인이 필요하다. */
export interface SearchOutboxTaskRepository {
    findById(userId: string, id: string): Promise<TaskEntity | null>;
}

/** 배출 시점의 메모 본문을 다시 읽는 포트다. */
export interface SearchOutboxMemoRepository {
    findById(id: string): Promise<MemoEntity | null>;
}

/** 배출 트랜잭션 안에서 아웃박스 배출이 사용하는 저장소 경계다. */
export interface SearchOutboxDrainRepositories {
    readonly searchOutbox: SearchOutboxRepositoryPort;
    readonly recipes: SearchOutboxRecipeRepository;
    readonly tasks: SearchOutboxTaskRepository;
    readonly taskUserStates: SearchOutboxTaskUserStateRepository;
    readonly memos: SearchOutboxMemoRepository;
}
