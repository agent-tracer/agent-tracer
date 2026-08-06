import {afterEach, describe, expect, it, vi} from "vitest";
import {HttpRecipeFetchAdapter} from "~plugin/domain/recipe/adapter/http.recipe.fetch.adapter.js";
import type {CachedRecipe} from "~plugin/domain/recipe/model/recipe.model.js";

const BASE_URL = "http://127.0.0.1:3847";

// 조회 창구는 레시피를 통계·적용 이력과 나란히 담아 보내므로 그 모양 그대로 흉내낸다.
function serving(payload: Record<string, unknown>): void {
    const body = {data: {recipe: payload, stats: {applied: 0}, applications: []}};
    vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
            new Response(JSON.stringify(body), {status: 200, headers: {"content-type": "application/json"}}),
        ),
    );
}

async function fetched(payload: Record<string, unknown>): Promise<CachedRecipe> {
    serving({id: "r1", title: "lint pipeline", ...payload});
    const result = await new HttpRecipeFetchAdapter(BASE_URL, {}).fetch("r1");
    if (result.kind !== "found") throw new Error(`레시피를 읽지 못했다: ${result.kind}`);
    return result.value;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("HttpRecipeFetchAdapter.fetch", () => {
    it("id와 title이 없으면 레시피로 세우지 않는다", async () => {
        serving({title: "제목만 있다"});

        const result = await new HttpRecipeFetchAdapter(BASE_URL, {}).fetch("r1");

        expect(result.kind).toBe("unavailable");
    });

    // 계약과 서버 저장에는 살아 있으나 이 매핑에서 빠져 에이전트에게 닿은 적이 없던 칸이다.
    it("단계의 verify를 세 갈래 모두 옮긴다", async () => {
        const recipe = await fetched({
            steps: [
                {order: 1, action: "린트를 돌린다", verify: {kind: "command", commandMatches: ["npm run lint"]}},
                {order: 2, action: "출력을 본다", verify: {kind: "pattern", pattern: "0 problems"}},
                {order: 3, action: "파일을 고친다", verify: {kind: "action", tool: "file-write"}},
            ],
        });

        expect(recipe.steps.map((step) => step.verify)).toEqual([
            {kind: "command", commandMatches: ["npm run lint"]},
            {kind: "pattern", pattern: "0 problems"},
            {kind: "action", tool: "file-write"},
        ]);
    });

    it("verify가 온전하지 않으면 단계를 버리지 않고 확인 신호만 뺀다", async () => {
        const recipe = await fetched({
            steps: [
                {order: 1, action: "린트를 돌린다", verify: {kind: "command", commandMatches: []}},
                {order: 2, action: "출력을 본다", verify: {kind: "action", tool: "telepathy"}},
                {order: 3, action: "파일을 고친다", verify: null},
            ],
        });

        expect(recipe.steps.map((step) => step.action)).toEqual(["린트를 돌린다", "출력을 본다", "파일을 고친다"]);
        expect(recipe.steps.every((step) => step.verify === undefined)).toBe(true);
    });

    it("적용 조건과 입력과 산출물을 옮긴다", async () => {
        const recipe = await fetched({
            useWhen: ["린트가 커밋 훅에서 깨질 때"],
            inputs: ["실패한 린트 출력"],
            outputs: ["통과하는 린트"],
        });

        expect(recipe.useWhen).toEqual(["린트가 커밋 훅에서 깨질 때"]);
        expect(recipe.inputs).toEqual(["실패한 린트 출력"]);
        expect(recipe.outputs).toEqual(["통과하는 린트"]);
    });

    it("복구는 symptom과 action을 갖춘 것만 옮기고 stepOrder는 있을 때만 싣는다", async () => {
        const recipe = await fetched({
            recovery: [
                {symptom: "린트가 캐시를 잡는다", action: "캐시를 지운다", stepOrder: 1},
                {symptom: "전체가 느리다", action: "범위를 좁힌다"},
                {symptom: "action이 없다"},
            ],
        });

        expect(recipe.recovery).toEqual([
            {symptom: "린트가 캐시를 잡는다", action: "캐시를 지운다", stepOrder: 1},
            {symptom: "전체가 느리다", action: "범위를 좁힌다"},
        ]);
    });

    it("참조 파일의 why와 loadWhen을 옮기고 없으면 싣지 않는다", async () => {
        const recipe = await fetched({
            touchedFiles: [
                {path: "a.ts", role: "read", why: "규칙의 정본이다", loadWhen: "규칙을 바꿀 때"},
                {path: "b.ts", role: "write"},
            ],
        });

        expect(recipe.touchedFiles).toEqual([
            {path: "a.ts", role: "read", why: "규칙의 정본이다", loadWhen: "규칙을 바꿀 때"},
            {path: "b.ts", role: "write"},
        ]);
    });

    it("새 칸이 없는 옛 응답도 빈 목록으로 읽는다", async () => {
        const recipe = await fetched({steps: [{order: 1, action: "린트를 돌린다"}]});

        expect(recipe.useWhen).toEqual([]);
        expect(recipe.inputs).toEqual([]);
        expect(recipe.outputs).toEqual([]);
        expect(recipe.recovery).toEqual([]);
        expect(recipe.steps[0]?.verify).toBeUndefined();
    });
});
