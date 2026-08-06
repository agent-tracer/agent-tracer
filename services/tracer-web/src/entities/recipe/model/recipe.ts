import type { TaskId } from "~tracer-web/shared/identity.js";

export type RecipeFileRole = "read" | "write" | "both";

export type RecipeVerify =
  | { readonly kind: "command"; readonly commandMatches: readonly string[] }
  | { readonly kind: "pattern"; readonly pattern: string }
  | { readonly kind: "action"; readonly tool: "command" | "file-read" | "file-write" | "web" };

export interface RecipeStep {
  readonly order: number;
  readonly action: string;
  readonly rationale?: string;
  /** 모든 단계가 이벤트로 관측되지는 않으므로 비어 있을 수 있다. */
  readonly evidence?: readonly string[];
  readonly verify?: RecipeVerify;
}

export interface RecipeTouchedFile {
  readonly path: string;
  readonly role: RecipeFileRole;
  readonly why?: string | null;
  readonly loadWhen?: string | null;
}

export interface RecipeSlice {
  readonly taskId: TaskId;
  readonly eventIds: readonly string[];
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

export interface RecipeRecovery {
  readonly symptom: string;
  readonly action: string;
  readonly evidence: readonly string[];
  /** 붙는 단계이며 비어 있으면 절차 전체에 걸친 복구다. */
  readonly stepOrder?: number | null;
}

export type RecipeStatus = "candidate" | "active" | "superseded" | "retired" | "dismissed";
export type RecipeStatusFilter = RecipeStatus | "all";

export interface Recipe {
  readonly id: string;
  readonly sourceCandidateId: string | null;
  readonly sourceJobId: string | null;
  readonly title: string;
  readonly intent: string;
  readonly description: string;
  readonly useWhen: readonly string[];
  readonly summaryMd: string;
  readonly request: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly corrections: readonly RecipeCorrection[];
  readonly pitfalls: readonly RecipePitfall[];
  readonly recovery: readonly RecipeRecovery[];
  readonly governingRules: readonly string[];
  readonly steps: readonly RecipeStep[];
  readonly touchedFiles: readonly RecipeTouchedFile[];
  readonly contributingSlices: readonly RecipeSlice[];
  readonly rev: number;
  readonly parentRecipeId: string | null;
  readonly status: RecipeStatus;
  readonly userEdited: boolean;
  readonly lastEditedBy: string;
  readonly applicationCount: number;
  readonly language: string | null;
  readonly rationale?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RecipesResponse {
  readonly recipes: readonly Recipe[];
  readonly taskTitleById: ReadonlyMap<string, string>;
}

export interface RecipeEditInput {
  readonly title?: string;
  readonly intent?: string;
  readonly description?: string;
  readonly summaryMd?: string;
}
