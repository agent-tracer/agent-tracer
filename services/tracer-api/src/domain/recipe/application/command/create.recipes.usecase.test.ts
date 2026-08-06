import { describe, expect, it } from "vitest";
import { RECIPE_EDITOR, RECIPE_STATUS } from "@agent-tracer/kernel";
import { RecipeEntity } from "@agent-tracer/tracer-model";
import { FixedClock } from "~tracer-api/domain/recipe/port/__fakes__/fixed.clock.js";
import { SequentialRecipeIdGenerator } from "~tracer-api/domain/recipe/port/__fakes__/sequential.recipe.id.generator.js";
import { InMemoryRecipeTransaction } from "~tracer-api/domain/recipe/port/__fakes__/in-memory.recipe.transaction.js";
import { CreateRecipesUseCase, type RecipeDraftInput } from "./create.recipes.usecase.js";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const clock = new FixedClock(NOW);

function draft(overrides: Partial<RecipeDraftInput> = {}): RecipeDraftInput {
    return {
        title: "제목",
        intent: "intent",
        description: "설명",
        summaryMd: "요약",
        request: "사용자가 작업 절차를 정리해 달라고 했다.",
        rationale: "같은 절차가 세 번 되풀이되었다.",
        corrections: [],
        pitfalls: [],
        useWhen: [],
        inputs: [],
        outputs: [],
        recovery: [],
        governingRules: [],
        steps: [],
        touchedFiles: [],
        contributingSlices: [{ taskId: "t1", turnIds: [], eventIds: ["e1"] }],
        ...overrides,
    };
}

function seedParent(tx: InMemoryRecipeTransaction, id: string, userId: string, rev: number): void {
    tx.recipes.seed(
        RecipeEntity.candidate(
            {
                id,
                userId,
                author: RECIPE_EDITOR.agent,
                rev,
                title: "부모",
                intent: "intent",
                description: "설명",
                summaryMd: "요약",
                request: "요청",
                corrections: [],
                pitfalls: [],
                useWhen: [],
                inputs: [],
                outputs: [],
                recovery: [],
                governingRules: [],
                steps: [],
                touchedFiles: [],
                contributingSlices: [],
            },
            NOW,
        ),
    );
}

function useCase(tx: InMemoryRecipeTransaction): CreateRecipesUseCase {
    return new CreateRecipesUseCase(tx, clock, new SequentialRecipeIdGenerator());
}

describe("CreateRecipesUseCase", () => {
    it("요청에 실린 순서대로 candidate 후보를 만들고 색인 적재를 함께 남긴다", async () => {
        const tx = new InMemoryRecipeTransaction();

        const result = await useCase(tx).execute({
            userId: "u1",
            author: RECIPE_EDITOR.agent,
            sourceJobId: "job-1",
            drafts: [draft({ title: "첫째" }), draft({ title: "둘째" })],
        });

        expect(result.replayed).toBe(false);
        expect(result.recipes.map((recipe) => recipe.title)).toEqual(["첫째", "둘째"]);
        expect(result.recipes.map((recipe) => recipe.status)).toEqual([RECIPE_STATUS.candidate, RECIPE_STATUS.candidate]);
        expect(result.recipes.map((recipe) => recipe.rev)).toEqual([1, 1]);
        expect(result.recipes.map((recipe) => recipe.sourceJobId)).toEqual(["job-1", "job-1"]);
        expect(tx.recipes.all()).toHaveLength(2);
        expect(tx.searchOutbox.all().map((row) => row.targetId)).toEqual(result.recipes.map((recipe) => recipe.id));
    });

    it("사람이 만든 한 벌은 사람이 고친 것으로 적는다", async () => {
        const tx = new InMemoryRecipeTransaction();

        const result = await useCase(tx).execute({ userId: "u1", author: RECIPE_EDITOR.user, drafts: [draft()] });

        expect(result.recipes[0]!.userEdited).toBe(true);
        expect(result.recipes[0]!.lastEditedBy).toBe(RECIPE_EDITOR.user);
    });

    it("sourceJobId를 싣지 않으면 대조하지 않고 언제나 새로 만든다", async () => {
        const tx = new InMemoryRecipeTransaction();
        const create = useCase(tx);

        await create.execute({ userId: "u1", author: RECIPE_EDITOR.agent, drafts: [draft()] });
        const second = await create.execute({ userId: "u1", author: RECIPE_EDITOR.agent, drafts: [draft()] });

        expect(second.replayed).toBe(false);
        expect(tx.recipes.all()).toHaveLength(2);
    });

    it("같은 sourceJobId를 다시 받으면 아무것도 쓰지 않고 앞의 한 벌을 낸다", async () => {
        const tx = new InMemoryRecipeTransaction();
        const create = useCase(tx);
        const first = await create.execute({
            userId: "u1",
            author: RECIPE_EDITOR.agent,
            sourceJobId: "job-1",
            drafts: [draft({ title: "첫째" })],
        });
        const outboxAfterFirst = tx.searchOutbox.all().length;

        const second = await create.execute({
            userId: "u1",
            author: RECIPE_EDITOR.agent,
            sourceJobId: "job-1",
            drafts: [draft({ title: "다른 제목" })],
        });

        expect(second.replayed).toBe(true);
        expect(second.recipes.map((recipe) => recipe.id)).toEqual(first.recipes.map((recipe) => recipe.id));
        expect(second.recipes[0]!.title).toBe("첫째");
        expect(tx.recipes.all()).toHaveLength(1);
        expect(tx.searchOutbox.all()).toHaveLength(outboxAfterFirst);
    });

    it("다른 사용자의 같은 sourceJobId는 대조하지 않는다", async () => {
        const tx = new InMemoryRecipeTransaction();
        const create = useCase(tx);
        await create.execute({ userId: "u1", author: RECIPE_EDITOR.agent, sourceJobId: "job-1", drafts: [draft()] });

        const other = await create.execute({
            userId: "u2",
            author: RECIPE_EDITOR.agent,
            sourceJobId: "job-1",
            drafts: [draft()],
        });

        expect(other.replayed).toBe(false);
        expect(tx.recipes.all()).toHaveLength(2);
    });

    it("부모의 판이 본 그대로면 개정으로 이어 판을 하나 올린다", async () => {
        const tx = new InMemoryRecipeTransaction();
        seedParent(tx, "parent", "u1", 3);

        const result = await useCase(tx).execute({
            userId: "u1",
            author: RECIPE_EDITOR.agent,
            drafts: [draft({ parentRecipeId: "parent", parentRecipeSeenRev: 3 })],
        });

        expect(result.recipes[0]!.parentRecipeId).toBe("parent");
        expect(result.recipes[0]!.rev).toBe(4);
    });

    it("부모의 판이 어긋나면 부모를 비우고도 거절하지 않는다", async () => {
        const tx = new InMemoryRecipeTransaction();
        seedParent(tx, "parent", "u1", 5);

        const result = await useCase(tx).execute({
            userId: "u1",
            author: RECIPE_EDITOR.agent,
            drafts: [draft({ parentRecipeId: "parent", parentRecipeSeenRev: 2 })],
        });

        expect(result.recipes[0]!.parentRecipeId).toBeNull();
        expect(result.recipes[0]!.rev).toBe(1);
    });

    it("남의 레시피를 부모로 지목하면 부모를 비운다", async () => {
        const tx = new InMemoryRecipeTransaction();
        seedParent(tx, "parent", "u2", 1);

        const result = await useCase(tx).execute({
            userId: "u1",
            author: RECIPE_EDITOR.agent,
            drafts: [draft({ parentRecipeId: "parent", parentRecipeSeenRev: 1 })],
        });

        expect(result.recipes[0]!.parentRecipeId).toBeNull();
    });

    it("한 벌을 쓰다 실패하면 앞서 쓴 후보와 적재 행이 남지 않는다", async () => {
        const tx = new InMemoryRecipeTransaction();
        const failing = new SequentialRecipeIdGenerator();
        let calls = 0;
        failing.next = () => {
            calls += 1;
            if (calls > 3) throw new Error("id exhausted");
            return `recipe-id-${calls}`;
        };
        const create = new CreateRecipesUseCase(tx, clock, failing);

        await expect(
            create.execute({ userId: "u1", author: RECIPE_EDITOR.agent, drafts: [draft(), draft()] }),
        ).rejects.toThrow("id exhausted");
        expect(tx.recipes.all()).toHaveLength(0);
        expect(tx.searchOutbox.all()).toHaveLength(0);
    });
});
