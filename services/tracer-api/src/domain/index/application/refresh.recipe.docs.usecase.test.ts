import { describe, expect, it } from "vitest";
import { RECIPE_EDITOR } from "@agent-tracer/kernel";
import { RecipeEntity, type RecipeCandidateInput } from "@agent-tracer/tracer-model";
import { RefreshRecipeDocsUseCase } from "./refresh.recipe.docs.usecase.js";
import type { RecipeDocReaderPort } from "~tracer-api/domain/index/port/recipe.doc.reader.port.js";
import type { SearchIndexWriterPort } from "~tracer-api/domain/index/port/search.index.writer.port.js";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function recipe(id: string, useWhen: readonly string[]): RecipeEntity {
    return RecipeEntity.candidate(
        {
            id,
            userId: "u1",
            author: RECIPE_EDITOR.agent,
            rev: 1,
            title: "lint pipeline",
            intent: "커밋 전에 린트를 돌린다",
            description: "설명",
            useWhen,
            summaryMd: "요약",
            request: "요청",
            inputs: [],
            outputs: [],
            corrections: [],
            pitfalls: [],
            recovery: [],
            governingRules: [],
            steps: [],
            touchedFiles: [{ path: "a.ts", role: "read" }],
            contributingSlices: [],
        } satisfies RecipeCandidateInput,
        NOW,
    );
}

function writer() {
    const indexed: { index: string; id: string; document: Record<string, unknown> }[] = [];
    const port = {
        ensureIndex: async () => undefined,
        writeBulk: async () => ({ errors: false, itemCount: 0 }),
        indexDocument: async (index: string, id: string, document: Record<string, unknown>) => {
            indexed.push({ index, id, document });
        },
        updateDocument: async () => undefined,
        deleteDocument: async () => undefined,
    } satisfies SearchIndexWriterPort;
    return { port, indexed };
}

function reader(recipes: readonly RecipeEntity[]): RecipeDocReaderPort {
    return { findLiveRecipes: async () => recipes };
}

describe("RefreshRecipeDocsUseCase", () => {
    it("살아 있는 레시피가 없으면 아무것도 쓰지 않는다", async () => {
        const { port, indexed } = writer();

        const count = await new RefreshRecipeDocsUseCase(reader([]), port).execute();

        expect(count).toBe(0);
        expect(indexed).toEqual([]);
    });

    // 재색인만으로는 옛 _source가 그대로 넘어와 매핑에 새로 생긴 칸이 빈 채로 남는다.
    it("읽기 모델의 useWhen을 실은 문서로 다시 지어 덮는다", async () => {
        const { port, indexed } = writer();

        const count = await new RefreshRecipeDocsUseCase(
            reader([recipe("r1", ["커밋 전에 린트를 돌릴 때"])]),
            port,
        ).execute();

        expect(count).toBe(1);
        expect(indexed[0]?.index).toBe("recipes");
        expect(indexed[0]?.id).toBe("r1");
        expect(indexed[0]?.document).toMatchObject({
            userId: "u1",
            title: "lint pipeline",
            useWhen: ["커밋 전에 린트를 돌릴 때"],
            touchedFiles: ["a.ts"],
        });
    });

    it("레시피마다 문서를 하나씩 쓴다", async () => {
        const { port, indexed } = writer();

        const count = await new RefreshRecipeDocsUseCase(
            reader([recipe("r1", []), recipe("r2", ["두 번째"])]),
            port,
        ).execute();

        expect(count).toBe(2);
        expect(indexed.map((entry) => entry.id)).toEqual(["r1", "r2"]);
    });
});
