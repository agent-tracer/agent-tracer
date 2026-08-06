import { describe, expect, it } from "vitest";
import { createBodySchema } from "~tracer-api/domain/recipe/inbound/recipe.create.schema.js";

// 계약은 배포 단위가 아니라 submodule 이므로 별칭 표에 자리가 없고 로더를 파일 위치로 찾는다.
const contractModuleUrl = new URL(
    "../../../../../../contract/conformance/runner/contract.mjs",
    import.meta.url,
);
const { readAgentCases } = (await import(contractModuleUrl.href)) as {
    readonly readAgentCases: (agentId: string) => RecipeScanCases;
};

interface CandidateSchemaCase {
    readonly name: string;
    readonly candidate: Record<string, unknown>;
    readonly expect: { readonly accepted: boolean; readonly field?: string };
}

interface RecipeScanCases {
    readonly cases: {
        readonly candidateDefaults: Record<string, unknown>;
        readonly candidateSchema: { readonly cases: readonly CandidateSchemaCase[] };
    };
}

/** 계약 산출은 snake_case 이고 저장 창구는 camelCase 라 케이스를 읽을 때 한 번만 옮긴다. */
const STORAGE_KEY: Readonly<Record<string, string>> = {
    use_when: "useWhen",
    summary_md: "summaryMd",
    governing_rules: "governingRules",
    touched_files: "touchedFiles",
    contributing_slices: "contributingSlices",
};

function toStorageKeys(candidate: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(candidate).map(([key, value]) => [STORAGE_KEY[key] ?? key, value]),
    );
}

const contractCases = readAgentCases("recipe-scan").cases;
const defaults = toStorageKeys(contractCases.candidateDefaults);

function parse(candidate: Record<string, unknown>): ReturnType<typeof createBodySchema.safeParse> {
    return createBodySchema.safeParse({
        recipes: [{ ...defaults, ...toStorageKeys(candidate) }],
        author: "agent",
    });
}

describe("recipe-scan 후보 스키마 적합성", () => {
    it("계약이 케이스를 싣고 있다", () => {
        expect(contractCases.candidateSchema.cases.length).toBeGreaterThan(0);
    });

    it("기본 후보는 그대로 읽힌다", () => {
        expect(parse({}).success).toBe(true);
    });

    for (const testCase of contractCases.candidateSchema.cases) {
        it(testCase.name, () => {
            const result = parse(testCase.candidate);

            expect(result.success).toBe(testCase.expect.accepted);
            if (result.success || testCase.expect.field === undefined) return;
            const paths = result.error.issues.map((issue) => issue.path.join("."));
            expect(paths.some((path) => path.includes(STORAGE_KEY[testCase.expect.field!] ?? testCase.expect.field!)))
                .toBe(true);
        });
    }
});
