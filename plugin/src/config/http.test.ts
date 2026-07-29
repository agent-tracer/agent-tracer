import {afterEach, describe, expect, it, vi} from "vitest";
import {getJson, resolveTimeoutSignal} from "~plugin/config/http.js";

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("resolveTimeoutSignal", () => {
    it("signal이 없으면 주어진 타임아웃으로 새 signal을 만든다", () => {
        const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

        resolveTimeoutSignal(10_000);

        expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    });

    it("signal이 있으면 그대로 돌려주고 타임아웃 signal을 만들지 않는다", () => {
        const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
        const controller = new AbortController();

        const resolved = resolveTimeoutSignal(10_000, controller.signal);

        expect(resolved).toBe(controller.signal);
        expect(timeoutSpy).not.toHaveBeenCalled();
    });
});

describe("getJson", () => {
    it("501은 그 창구가 배포에 없다는 확답으로 읽는다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", {status: 501})));

        expect(await getJson("http://127.0.0.1:3847/api/agent/settings", {})).toEqual({kind: "unsupported"});
    });

    it("404는 자원이 없다는 확답이고 그 밖의 실패는 확답이 아니다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", {status: 404})));
        expect(await getJson("http://127.0.0.1:3847/api/v1/recipes/x", {})).toEqual({kind: "absent"});

        vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", {status: 502})));
        expect(await getJson("http://127.0.0.1:3847/api/v1/recipes/x", {})).toEqual({kind: "unavailable"});
    });
});
