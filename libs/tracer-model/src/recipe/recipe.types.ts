import type { RecipeEditor } from "@agent-tracer/kernel";

/** applicationCount는 자기보고 여부와 무관한 적용 행 총 수이고, decidedCount는 그중 자기보고가 붙은 수다. */
export interface RecipeStats {
    readonly applicationCount: number;
    readonly decidedCount: number;
    readonly successRate: number;
}

export interface RecipeCorrection {
    readonly whatAgentDid: string;
    readonly howCorrected: string;
    readonly evidence: readonly string[];
}

export interface RecipePitfall {
    readonly pitfall: string;
    readonly whyNonObvious: string;
    readonly evidence: readonly string[];
}

export interface RecipeTouchedFile {
    readonly path: string;
    readonly role: "read" | "write" | "both";
}

export interface RecipeRevisionInput {
    readonly title?: string;
    readonly intent?: string;
    readonly description?: string;
    readonly summaryMd?: string;
    readonly request?: string;
    readonly corrections?: readonly RecipeCorrection[];
    readonly pitfalls?: readonly RecipePitfall[];
    readonly governingRules?: readonly string[];
    readonly steps?: readonly unknown[];
    readonly touchedFiles?: readonly RecipeTouchedFile[];
    readonly contributingSlices?: readonly unknown[];
    readonly rationale?: string | null;
    readonly language?: string | null;
    readonly sourceJobId?: string | null;
}

export interface RecipeCandidateInput {
    readonly id: string;
    readonly userId: string;
    /** 이 후보를 만든 주체이며 사람이 만든 것과 자동으로 만들어진 것을 가른다. */
    readonly author: RecipeEditor;
    /** 개정으로 이어진 후보는 부모의 판에 하나를 더한 값을 갖고 그렇지 않으면 1이다. */
    readonly rev: number;
    readonly title: string;
    readonly intent: string;
    readonly description: string;
    readonly summaryMd: string;
    readonly request: string;
    readonly corrections: readonly RecipeCorrection[];
    readonly pitfalls: readonly RecipePitfall[];
    readonly governingRules: readonly string[];
    readonly steps: readonly unknown[];
    readonly touchedFiles: readonly RecipeTouchedFile[];
    readonly contributingSlices: readonly unknown[];
    readonly rationale?: string;
    readonly language?: string;
    readonly parentRecipeId?: string;
    readonly sourceJobId?: string;
}
