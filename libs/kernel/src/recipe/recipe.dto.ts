import type { RecipeInjectedVia } from "../ingest/event.kind.const.js";
import type { RecipeEditor, RecipeOutcome, RecipeStatus } from "./recipe.const.js";

/** applicationCount는 자기보고 여부와 무관한 적용 행 총 수이고, decidedCount는 그중 자기보고가 붙은 수다. */
export interface RecipeStatsDto {
    readonly applicationCount: number;
    readonly decidedCount: number;
    readonly successRate: number;
}

export interface RecipeCorrectionDto {
    readonly whatAgentDid: string;
    readonly howCorrected: string;
    readonly evidence: readonly string[];
}

export interface RecipePitfallDto {
    readonly pitfall: string;
    readonly whyNonObvious: string;
    readonly evidence: readonly string[];
}

/** correction이 이미 symptom→action 쌍이라 같은 근거 요구를 그대로 물려받는다. */
export interface RecipeRecoveryDto {
    readonly symptom: string;
    readonly action: string;
    readonly evidence: readonly string[];
    /** 이 복구가 붙는 단계이며 비어 있으면 절차 전체에 걸친 복구다. */
    readonly stepOrder?: number | null;
}

export type RecipeFileRole = "read" | "write" | "both";

export interface RecipeTouchedFileDto {
    readonly path: string;
    readonly role: RecipeFileRole;
    readonly why?: string | null;
    readonly loadWhen?: string | null;
}

export type RecipeVerifyTool = "command" | "file-read" | "file-write" | "web";

export interface RecipeVerifyCommandDto {
    readonly kind: "command";
    readonly commandMatches: readonly string[];
}

export interface RecipeVerifyPatternDto {
    readonly kind: "pattern";
    readonly pattern: string;
}

export interface RecipeVerifyActionDto {
    readonly kind: "action";
    readonly tool: RecipeVerifyTool;
}

export type RecipeVerifyDto = RecipeVerifyCommandDto | RecipeVerifyPatternDto | RecipeVerifyActionDto;

export interface RecipeStepDto {
    readonly order: number;
    readonly action: string;
    readonly rationale?: string;
    /** 모든 단계가 이벤트로 관측되지는 않으므로 비어 있을 수 있다. */
    readonly evidence?: readonly string[];
    readonly verify?: RecipeVerifyDto;
}

export interface RecipeDto {
    readonly id: string;
    readonly userId: string;
    readonly status: RecipeStatus;
    readonly title: string;
    readonly intent: string;
    readonly description: string;
    /** 이 레시피가 적용되는 조건이며 검색 단계에서 이미 보여야 하는 판단 정보다. */
    readonly useWhen: readonly string[];
    readonly summaryMd: string;
    readonly request: string;
    readonly inputs: readonly string[];
    readonly outputs: readonly string[];
    readonly corrections: readonly RecipeCorrectionDto[];
    readonly pitfalls: readonly RecipePitfallDto[];
    readonly recovery: readonly RecipeRecoveryDto[];
    readonly governingRules: readonly string[];
    readonly steps: readonly RecipeStepDto[];
    readonly touchedFiles: readonly RecipeTouchedFileDto[];
    readonly contributingSlices: readonly unknown[];
    readonly rationale: string | null;
    readonly language: string | null;
    readonly rev: number;
    readonly parentRecipeId: string | null;
    readonly sourceJobId: string | null;
    readonly userEdited: boolean;
    readonly lastEditedBy: RecipeEditor;
    readonly error: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly resolvedAt: string | null;
}

export interface RecipeWithStatsDto extends RecipeDto {
    readonly stats: RecipeStatsDto;
}

export interface RecipeApplicationDto {
    readonly id: string;
    readonly userId: string;
    readonly recipeId: string;
    readonly taskId: string;
    readonly injectedVia: RecipeInjectedVia;
    readonly outcome: RecipeOutcome | null;
    readonly note: string | null;
    readonly createdAt: string;
}
