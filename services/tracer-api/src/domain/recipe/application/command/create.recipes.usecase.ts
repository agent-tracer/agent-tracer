import { Inject, Injectable } from "@nestjs/common";
import { RecipeEntity, type RecipeCandidateInput } from "@agent-tracer/tracer-model";
import type { RecipeEditor } from "@agent-tracer/kernel";
import { CLOCK, type ClockPort } from "~tracer-api/domain/recipe/port/clock.port.js";
import { RECIPE_ID_GENERATOR, type RecipeIdGeneratorPort } from "~tracer-api/domain/recipe/port/recipe.id.generator.port.js";
import { RECIPE_TRANSACTION, type RecipeTransactionPort, type RecipeTx } from "~tracer-api/domain/recipe/port/recipe.transaction.port.js";
import { enqueueRecipeIndex, mapRecipe, type RecipeDto } from "~tracer-api/domain/recipe/application/recipe.support.js";

/** 아직 원장에 없는 레시피 하나이며 식별자와 상태와 판은 창구가 정한다. */
export interface RecipeDraftInput {
    readonly title: string;
    readonly intent: string;
    readonly description: string;
    readonly summaryMd: string;
    readonly request: string;
    readonly rationale: string;
    readonly corrections: readonly unknown[];
    readonly pitfalls: readonly unknown[];
    readonly governingRules: readonly string[];
    readonly steps: readonly unknown[];
    readonly touchedFiles: readonly unknown[];
    readonly contributingSlices: readonly unknown[];
    readonly language?: string | null | undefined;
    readonly parentRecipeId?: string | null | undefined;
    /** 부르는 쪽이 본 부모의 판이며 지금 원장의 판과 다르면 부모를 잃은 채로 만들어진다. */
    readonly parentRecipeSeenRev?: number | undefined;
}

export interface CreateRecipesInput {
    readonly userId: string;
    readonly author: RecipeEditor;
    readonly sourceJobId?: string | null | undefined;
    readonly drafts: readonly RecipeDraftInput[];
}

export interface CreateRecipesResult {
    readonly recipes: readonly RecipeDto[];
    /** 같은 sourceJobId로 이미 만들어진 한 벌을 그대로 낸 응답이면 참이다. */
    readonly replayed: boolean;
}

@Injectable()
export class CreateRecipesUseCase {
    constructor(
        @Inject(RECIPE_TRANSACTION)
        private readonly tx: RecipeTransactionPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
        @Inject(RECIPE_ID_GENERATOR)
        private readonly idGenerator: RecipeIdGeneratorPort,
    ) {}

    async execute(input: CreateRecipesInput): Promise<CreateRecipesResult> {
        const now = this.clock.now();
        return this.tx.run((tx) => this.applyInTransaction(tx, input, now));
    }

    private async applyInTransaction(tx: RecipeTx, input: CreateRecipesInput, now: Date): Promise<CreateRecipesResult> {
        const sourceJobId = input.sourceJobId ?? null;
        if (sourceJobId !== null) {
            const written = await tx.recipes.findBySourceJobId(input.userId, sourceJobId);
            if (written.length > 0) return { recipes: written.map(mapRecipe), replayed: true };
        }

        const created: RecipeEntity[] = [];
        for (const draft of input.drafts) {
            const parent = await this.resolveParent(tx, input.userId, draft);
            const recipe = RecipeEntity.candidate(
                {
                    id: this.idGenerator.next(),
                    userId: input.userId,
                    author: input.author,
                    rev: parent !== null ? parent.rev + 1 : 1,
                    title: draft.title,
                    intent: draft.intent,
                    description: draft.description,
                    summaryMd: draft.summaryMd,
                    request: draft.request,
                    rationale: draft.rationale,
                    corrections: draft.corrections as RecipeCandidateInput["corrections"],
                    pitfalls: draft.pitfalls as RecipeCandidateInput["pitfalls"],
                    governingRules: draft.governingRules,
                    steps: draft.steps,
                    touchedFiles: draft.touchedFiles as RecipeCandidateInput["touchedFiles"],
                    contributingSlices: draft.contributingSlices,
                    ...(draft.language !== undefined && draft.language !== null ? { language: draft.language } : {}),
                    ...(parent !== null ? { parentRecipeId: parent.id } : {}),
                    ...(sourceJobId !== null ? { sourceJobId } : {}),
                },
                now,
            );
            await tx.recipes.upsert(recipe);
            await tx.searchOutbox.enqueue(enqueueRecipeIndex(this.idGenerator.next(), input.userId, recipe.id, now));
            created.push(recipe);
        }
        return { recipes: created.map(mapRecipe), replayed: false };
    }

    /** 부모가 이 사용자의 것이고 부르는 쪽이 본 판을 여전히 가리킬 때만 개정으로 잇고 어긋나면 거절하지 않고 끊는다. */
    private async resolveParent(tx: RecipeTx, userId: string, draft: RecipeDraftInput): Promise<RecipeEntity | null> {
        if (draft.parentRecipeId === undefined || draft.parentRecipeId === null) return null;
        if (draft.parentRecipeSeenRev === undefined) return null;
        const parent = await tx.recipes.findById(draft.parentRecipeId);
        if (parent === null || parent.userId !== userId) return null;
        return parent.isRevisionStale(draft.parentRecipeSeenRev) ? null : parent;
    }
}
