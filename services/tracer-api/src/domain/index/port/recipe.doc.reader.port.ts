import type { RecipeEntity } from "@agent-tracer/tracer-model";

export const RECIPE_DOC_READER = Symbol("RecipeDocReader");

/** `recipes` 색인은 원장이 아니라 읽기 모델이 정본이므로 재색인 뒤 새 칸을 채울 때 여기서 다시 읽는다. */
export interface RecipeDocReaderPort {
    findLiveRecipes(): Promise<readonly RecipeEntity[]>;
}
