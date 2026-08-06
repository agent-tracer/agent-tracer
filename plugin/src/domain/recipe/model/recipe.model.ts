export type CachedRecipeVerify =
    | {readonly kind: "command"; readonly commandMatches: readonly string[]}
    | {readonly kind: "pattern"; readonly pattern: string}
    | {readonly kind: "action"; readonly tool: "command" | "file-read" | "file-write" | "web"};

export interface CachedRecipeStep {
    readonly order: number;
    readonly action: string;
    readonly rationale?: string;
    /** 이 단계가 이행됐는지 확인할 관측 가능한 신호다. */
    readonly verify?: CachedRecipeVerify;
}

export interface CachedRecipeCorrection {
    readonly whatAgentDid: string;
    readonly howCorrected: string;
}

export interface CachedRecipePitfall {
    readonly pitfall: string;
    readonly whyNonObvious: string;
}

export interface CachedRecipeRecovery {
    readonly symptom: string;
    readonly action: string;
    /** 연결된 단계이며 비어 있으면 절차 전체에 걸친 복구라 Corrections 뒤에 모인다. */
    readonly stepOrder?: number;
}

export interface CachedRecipeTouchedFile {
    readonly path: string;
    readonly role: "read" | "write" | "both";
    readonly why?: string;
    readonly loadWhen?: string;
}

/** 캐시가 담는 레시피는 본문 전체이며 활성화 판단은 에이전트가 get_recipe로 직접 열어본 뒤 내린다. */
export interface CachedRecipe {
    readonly id: string;
    readonly title: string;
    readonly intent: string;
    readonly description: string;
    readonly useWhen: readonly string[];
    readonly summaryMd: string;
    readonly inputs: readonly string[];
    readonly outputs: readonly string[];
    readonly steps: readonly CachedRecipeStep[];
    readonly pitfalls: readonly CachedRecipePitfall[];
    readonly corrections: readonly CachedRecipeCorrection[];
    readonly recovery: readonly CachedRecipeRecovery[];
    readonly touchedFiles: readonly CachedRecipeTouchedFile[];
    readonly governingRules: readonly string[];
}
