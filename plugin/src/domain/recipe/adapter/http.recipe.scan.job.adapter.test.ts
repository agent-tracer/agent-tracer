import {afterEach, describe, expect, it, vi} from "vitest";
import {HttpRecipeScanJobAdapter} from "~plugin/domain/recipe/adapter/http.recipe.scan.job.adapter.js";

const BASE_URL = "http://127.0.0.1:3847";

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json"}});
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("HttpRecipeScanJobAdapter.isAvailable", () => {
    it("에이전트 접두사가 501을 내면 사용할 수 없다고 본다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response(null, {status: 501})));

        const available = await new HttpRecipeScanJobAdapter(BASE_URL, {}).isAvailable();

        expect(available).toBe(false);
    });

    it("잡 접수 창구가 응답하면 사용할 수 있다고 본다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({data: {items: []}})));

        const available = await new HttpRecipeScanJobAdapter(BASE_URL, {}).isAvailable();

        expect(available).toBe(true);
    });

    it("경로는 찾았지만 응답이 실패해도 배포가 없다고 단정하지 않는다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response(null, {status: 400})));

        const available = await new HttpRecipeScanJobAdapter(BASE_URL, {}).isAvailable();

        expect(available).toBe(true);
    });
});

describe("HttpRecipeScanJobAdapter.enqueue", () => {
    it("에이전트 잡 접수 경로로 넣는다", async () => {
        const fetchMock = vi.fn(async () => jsonResponse({data: {job: {id: "job-1"}}}, 202));
        vi.stubGlobal("fetch", fetchMock);

        await new HttpRecipeScanJobAdapter(BASE_URL, {}).enqueue("task-1", "event-1");

        expect(fetchMock).toHaveBeenCalledWith(
            `${BASE_URL}/api/agent/jobs`,
            expect.objectContaining({method: "POST"}),
        );
    });
});
