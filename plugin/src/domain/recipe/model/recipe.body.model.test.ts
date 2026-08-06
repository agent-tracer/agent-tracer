import {describe, expect, it} from "vitest";
import {buildRecipeBody} from "~plugin/domain/recipe/model/recipe.body.model.js";
import type {CachedRecipe} from "~plugin/domain/recipe/model/recipe.model.js";

function recipe(overrides: Partial<CachedRecipe> = {}): CachedRecipe {
    return {
        id: "r1",
        title: "lint pipeline",
        intent: "커밋 전에 린트를 돌린다",
        description: "린트 파이프라인을 정리한다",
        summaryMd: "",
        steps: [],
        pitfalls: [],
        corrections: [],
        touchedFiles: [],
        useWhen: [],
        inputs: [],
        outputs: [],
        recovery: [],
        governingRules: [],
        ...overrides,
    };
}

function lineOf(body: string, needle: string): number {
    return body.split("\n").findIndex((line) => line.includes(needle));
}

describe("buildRecipeBody", () => {
    it("title과 intent와 description을 싣는다", () => {
        const body = buildRecipeBody(recipe());

        expect(body).toContain("# lint pipeline");
        expect(body).toContain("intent: 커밋 전에 린트를 돌린다");
        expect(body).toContain("린트 파이프라인을 정리한다");
    });

    it("steps를 순서대로 번호를 매겨 싣는다", () => {
        const body = buildRecipeBody(recipe({
            steps: [
                {order: 2, action: "테스트를 돌린다"},
                {order: 1, action: "린트를 돌린다", rationale: "가장 빠르게 실패한다"},
            ],
        }));

        expect(body).toContain("1. 린트를 돌린다 (가장 빠르게 실패한다)");
        expect(body).toContain("2. 테스트를 돌린다");
        expect(lineOf(body, "린트를 돌린다")).toBeLessThan(lineOf(body, "테스트를 돌린다"));
    });

    // verify는 계약과 서버 저장에 살아 있었으나 fetch 매핑에서 빠져 에이전트에게 닿은 적이 없었다.
    it("단계의 verify를 세 갈래 모두 싣는다", () => {
        const body = buildRecipeBody(recipe({
            steps: [
                {order: 1, action: "린트를 돌린다", verify: {kind: "command", commandMatches: ["npm run lint"]}},
                {order: 2, action: "출력을 본다", verify: {kind: "pattern", pattern: "0 problems"}},
                {order: 3, action: "파일을 고친다", verify: {kind: "action", tool: "file-write"}},
            ],
        }));

        expect(body).toContain("verify: run a command matching npm run lint");
        expect(body).toContain("verify: output matches 0 problems");
        expect(body).toContain("verify: observed as file-write");
    });

    it("긴 summaryMd를 자르지 않고 그대로 싣는다", () => {
        const long = "가".repeat(1000);

        const body = buildRecipeBody(recipe({summaryMd: long}));

        expect(body).toContain(long);
    });

    it("pitfalls와 corrections와 touchedFiles와 governingRules를 조건부로 싣는다", () => {
        const body = buildRecipeBody(recipe({
            pitfalls: [{pitfall: "캐시가 비어 보인다", whyNonObvious: "필드 이름이 다르다"}],
            corrections: [{whatAgentDid: "score를 읽었다", howCorrected: "score를 지웠다"}],
            touchedFiles: [{path: "a.ts", role: "write"}, {path: "b.ts", role: "read"}],
            governingRules: ["rule-1"],
        }));

        expect(body).toContain("캐시가 비어 보인다 — 필드 이름이 다르다");
        expect(body).toContain("score를 읽었다 → score를 지웠다");
        expect(body).toContain("- a.ts (write)");
        expect(body).toContain("- b.ts (read)");
        expect(body).toContain("governing rules: rule-1");
    });

    it("참조 파일의 why와 loadWhen을 같은 줄에 붙인다", () => {
        const body = buildRecipeBody(recipe({
            touchedFiles: [{path: "a.ts", role: "read", why: "규칙의 정본이다", loadWhen: "규칙을 바꿀 때"}],
        }));

        expect(body).toContain("- a.ts (read) — 규칙의 정본이다; read when 규칙을 바꿀 때");
    });

    it("SKILL.md 순서대로 절을 낸다", () => {
        const body = buildRecipeBody(recipe({
            useWhen: ["린트가 커밋 훅에서 깨질 때"],
            inputs: ["실패한 린트 출력"],
            outputs: ["통과하는 린트"],
            summaryMd: "요약본",
            steps: [{order: 1, action: "린트를 돌린다"}],
            pitfalls: [{pitfall: "캐시가 비어 보인다", whyNonObvious: "필드 이름이 다르다"}],
            corrections: [{whatAgentDid: "score를 읽었다", howCorrected: "score를 지웠다"}],
            touchedFiles: [{path: "a.ts", role: "read"}],
            governingRules: ["rule-1"],
        }));

        const order = [
            "# lint pipeline",
            "## When to use",
            "## Before you start",
            "요약본",
            "## Workflow",
            "## Pitfalls",
            "## Corrections",
            "## When you are done",
            "## References",
            "governing rules:",
        ].map((needle) => lineOf(body, needle));

        expect(order).toEqual([...order].sort((left, right) => left - right));
        expect(order.every((index) => index >= 0)).toBe(true);
    });

    it("단계에 매인 복구는 그 단계 아래에 붙고 매이지 않은 것은 Corrections 뒤에 모인다", () => {
        const body = buildRecipeBody(recipe({
            steps: [{order: 1, action: "린트를 돌린다"}, {order: 2, action: "테스트를 돌린다"}],
            corrections: [{whatAgentDid: "score를 읽었다", howCorrected: "score를 지웠다"}],
            recovery: [
                {symptom: "린트가 캐시를 잡는다", action: "캐시를 지우고 다시 돌린다", stepOrder: 1},
                {symptom: "전체가 느리다", action: "범위를 좁힌다"},
            ],
        }));

        expect(lineOf(body, "린트가 캐시를 잡는다")).toBeLessThan(lineOf(body, "2. 테스트를 돌린다"));
        expect(body).toContain("   - recovery: 린트가 캐시를 잡는다 → 캐시를 지우고 다시 돌린다");
        expect(lineOf(body, "## Recovery")).toBeGreaterThan(lineOf(body, "## Corrections"));
        expect(body).toContain("- 전체가 느리다 → 범위를 좁힌다");
    });

    it("비어 있는 목록은 해당 절을 만들지 않는다", () => {
        const body = buildRecipeBody(recipe());

        expect(body).not.toContain("## Workflow");
        expect(body).not.toContain("## Pitfalls");
        expect(body).not.toContain("## Corrections");
        expect(body).not.toContain("## When to use");
        expect(body).not.toContain("## Before you start");
        expect(body).not.toContain("## When you are done");
        expect(body).not.toContain("## Recovery");
        expect(body).not.toContain("## References");
        expect(body).not.toContain("governing rules:");
    });
});
