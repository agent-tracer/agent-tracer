import type { RecipeEntity } from "@agent-tracer/tracer-model";

/** touchedFiles는 {path, role} 객체 배열이지만 검색 색인은 경로만 키워드로 걸러 쓴다. */
function touchedFilePaths(touchedFiles: readonly unknown[]): string[] {
    return touchedFiles
        .map((entry) => (entry !== null && typeof entry === "object" ? (entry as { path?: unknown }).path : undefined))
        .filter((path): path is string => typeof path === "string");
}

/** `recipes` 색인 문서의 단일 정의이며 매핑을 바꾸면 이 함수도 함께 바꾼다. */
export function buildRecipeDocument(recipe: RecipeEntity): Record<string, unknown> {
    return {
        userId: recipe.userId,
        title: recipe.title,
        intent: recipe.intent,
        description: recipe.description,
        useWhen: recipe.useWhen,
        summaryMd: recipe.summaryMd,
        touchedFiles: touchedFilePaths(recipe.touchedFiles),
        status: recipe.status,
        userEdited: recipe.userEdited,
        rev: recipe.rev,
        updatedAt: recipe.updatedAt.toISOString(),
    };
}
