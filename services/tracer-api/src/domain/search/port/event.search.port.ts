export const EVENT_SEARCH = Symbol("EventSearch");

/** 이벤트 검색 요청을 검색 구현과 분리하는 애플리케이션 포트다. */
export interface EventSearchQuery {
    readonly userId: string;
    readonly q?: string;
    readonly taskId?: string;
    readonly kind?: string;
    readonly lane?: string;
    readonly from?: string;
    readonly to?: string;
    readonly toolName?: string;
    readonly limit: number;
    /** 앞에서 건너뛸 적중 수이며 같은 조건을 여러 장으로 나눠 읽을 때 쓴다. */
    readonly offset?: number;
}

/** 이벤트 검색 결과의 애플리케이션 표현이다. */
export interface EventSearchHit {
    readonly id: string;
    readonly taskId: string;
    readonly sessionId?: string;
    readonly turnId?: string;
    readonly kind: string;
    readonly lane: string;
    readonly title: string;
    readonly body?: string;
    readonly toolName?: string;
    readonly filePaths: readonly string[];
    readonly seq?: string;
    readonly occurredAt?: string;
}

/** 사용자 범위 이벤트 검색을 제공하는 애플리케이션 포트다. */
export interface EventSearchPort {
    search(query: EventSearchQuery): Promise<readonly EventSearchHit[]>;
}
