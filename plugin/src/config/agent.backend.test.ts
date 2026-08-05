import {afterEach, describe, expect, it, vi} from "vitest";
import {
    HttpAgentBackend,
    preferredAgentBackend,
    resolveAgentBackend,
    withAgentBackend,
} from "~plugin/config/agent.backend.js";

const BASE_URL = "http://127.0.0.1:3847";
const TWO_AXES = {upstreams: [{name: "ts"}, {name: "python"}]};

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json"}});
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("resolveAgentBackend", () => {
    it("상류가 둘 이상이면 선언의 첫 축을 고른다", () => {
        expect(resolveAgentBackend(TWO_AXES, null)).toBe("ts");
    });

    it("못박은 축이 선언에 있으면 그 축을 고른다", () => {
        expect(resolveAgentBackend(TWO_AXES, "python")).toBe("python");
    });

    it("못박은 축이 선언에 없으면 선언의 첫 축으로 떨어진다", () => {
        expect(resolveAgentBackend(TWO_AXES, "go")).toBe("ts");
    });

    it("상류가 하나뿐이면 고를 것이 없다", () => {
        expect(resolveAgentBackend({upstreams: [{name: "ts"}]}, "ts")).toBeNull();
    });

    it("에이전트가 배포에 없으면 고를 것이 없다", () => {
        expect(resolveAgentBackend({upstreams: []}, "ts")).toBeNull();
    });
});

describe("withAgentBackend", () => {
    it("질의 문자열이 없으면 축을 첫 파라미터로 붙인다", () => {
        expect(withAgentBackend("http://h/api/agent/jobs", "ts")).toBe("http://h/api/agent/jobs?backend=ts");
    });

    it("질의 문자열이 있으면 축을 이어 붙인다", () => {
        expect(withAgentBackend("http://h/api/agent/jobs?kind=rule.generation", "ts"))
            .toBe("http://h/api/agent/jobs?kind=rule.generation&backend=ts");
    });

    it("고른 축이 없으면 URL을 그대로 둔다", () => {
        expect(withAgentBackend("http://h/api/agent/jobs", null)).toBe("http://h/api/agent/jobs");
    });
});

describe("preferredAgentBackend", () => {
    it("환경변수가 축을 못박는다", () => {
        expect(preferredAgentBackend({MONITOR_AGENT_BACKEND: " ts "})).toBe("ts");
    });

    it("값이 비면 못박지 않은 것으로 본다", () => {
        expect(preferredAgentBackend({MONITOR_AGENT_BACKEND: "  "})).toBeNull();
        expect(preferredAgentBackend({})).toBeNull();
    });
});

describe("HttpAgentBackend", () => {
    it("상류 목록을 한 번만 읽고 판단을 재사용한다", async () => {
        const seen: string[] = [];
        const fetchMock = vi.fn(async (url: string) => {
            seen.push(url);
            return jsonResponse({ok: true, data: TWO_AXES});
        });
        vi.stubGlobal("fetch", fetchMock);
        const backend = new HttpAgentBackend(BASE_URL, {});

        expect(await backend.current()).toBe("ts");
        expect(await backend.current()).toBe("ts");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(seen).toEqual([`${BASE_URL}/api/agent/upstreams`]);
    });

    it("목록을 읽지 못한 회차는 판단으로 남기지 않고 다음에 다시 묻는다", async () => {
        let call = 0;
        const fetchMock = vi.fn(async () => {
            call += 1;
            return call === 1 ? jsonResponse({}, 503) : jsonResponse({ok: true, data: TWO_AXES});
        });
        vi.stubGlobal("fetch", fetchMock);
        const backend = new HttpAgentBackend(BASE_URL, {});

        expect(await backend.current()).toBeNull();
        expect(await backend.current()).toBe("ts");
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("동시에 물어도 목록은 한 번만 읽는다", async () => {
        const fetchMock = vi.fn(async () => jsonResponse({ok: true, data: TWO_AXES}));
        vi.stubGlobal("fetch", fetchMock);
        const backend = new HttpAgentBackend(BASE_URL, {});

        const [first, second] = await Promise.all([backend.current(), backend.current()]);

        expect([first, second]).toEqual(["ts", "ts"]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
