export const RECIPE_SEARCH = Symbol("RecipeSearch");

/** 검색 색인이 낸 레시피 한 건이며 score는 질의와의 상대 적합도다. */
export interface RecipeSearchHit {
    readonly id: string;
    readonly title: string;
    readonly intent: string;
    readonly description: string;
    /** get_recipe가 적용을 기록하므로 적용 여부 판단에 필요한 조건은 검색 결과가 이미 실어야 한다. */
    readonly useWhen: readonly string[];
    readonly status: string;
    readonly userEdited: boolean;
    readonly score: number;
    readonly updatedAt?: string;
}

/** 레시피 검색 색인의 질의를 제공하는 애플리케이션 포트이며, 쓰기는 검색 아웃박스가 대신한다. */
export interface RecipeSearchPort {
    search(userId: string, q: string, limit: number): Promise<readonly RecipeSearchHit[]>;
}
