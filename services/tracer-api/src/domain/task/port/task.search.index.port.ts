export const TASK_SEARCH_INDEX = Symbol("TaskSearchIndex");

/** 태스크 사용자 상태의 검색 색인 갱신을 제공하는 애플리케이션 포트다. */
export interface TaskSearchIndexPort {
    partialUpdate(userId: string, taskId: string, doc: Record<string, unknown>): Promise<void>;
    /** 색인에 문서가 아직 없는 태스크(분리로 태어난 태스크)를 위한 전체 색인이다. */
    indexTask(userId: string, taskId: string, doc: Record<string, unknown>): Promise<void>;
    removeTask(userId: string, taskId: string): Promise<void>;
}
