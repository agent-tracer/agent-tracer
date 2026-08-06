import type {Fetched} from "~plugin/support/fetched.js";

/** 서버 검색 색인이 낸 레시피 한 건이며 steps·pitfalls·corrections 같은 본문은 담지 않는다. */
export interface RecipeSearchResultItem {
    readonly recipeId: string;
    readonly title: string;
    readonly intent: string;
    readonly description: string;
    /** get_recipe는 적용을 원장에 기록하므로 적용 여부 판단은 이 칸까지만 보고 끝나야 한다. */
    readonly useWhen: readonly string[];
    readonly score: number;
}

/** 워크스페이스 레시피를 질의어로 찾는 아웃바운드 포트이며 접속 실패를 구분해 낸다. */
export interface RecipeSearchPort {
    search(query: string, limit: number): Promise<Fetched<readonly RecipeSearchResultItem[]>>;
}
