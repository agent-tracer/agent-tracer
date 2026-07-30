import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearUserIdentity,
  setUserIdentity,
} from "~tracer-web/shared/api/user-identity.js";
import { setDefaultAgentBackend } from "~tracer-web/shared/api/agent-backend.js";
import { request } from "~tracer-web/shared/api/client/request.js";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  clearUserIdentity();
  setDefaultAgentBackend(null);
});

describe("request", () => {
  it("신원 헤더와 쿠키를 포함해 설정된 API 기준 주소로 요청한다", async () => {
    setUserIdentity("user-1", "user@example.com");
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await request("/api/v1/tasks", undefined, { timeoutMs: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url as string).toMatch(/\/api\/v1\/tasks$/);
    expect(init?.credentials).toBe("include");
    expect(new Headers(init?.headers).get("x-monitor-user")).toBe("user-1");
  });

  it("축을 지목하지 않은 요청이 선언의 첫 상류로 간다", async () => {
    setDefaultAgentBackend("python");
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await request("/api/agent/jobs", undefined, { timeoutMs: 0 });
    await request("/api/agent/jobs/history?kind=recipe_scan", undefined, { timeoutMs: 0 });
    await request("/api/v1/tasks", undefined, { timeoutMs: 0 });

    const urls = fetchMock.mock.calls.map(([url]) => url as string);
    expect(urls[0]).toMatch(/\/api\/agent\/jobs\?backend=python$/);
    expect(urls[1]).toMatch(/\/api\/agent\/jobs\/history\?kind=recipe_scan&backend=python$/);
    expect(urls[2]).toMatch(/\/api\/v1\/tasks$/);
  });

  it("상류가 하나 이하이면 파라미터를 싣지 않는다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await request("/api/agent/jobs", undefined, { timeoutMs: 0 });

    expect(fetchMock.mock.calls[0]?.[0] as string).toMatch(/\/api\/agent\/jobs$/);
  });

  it("부르는 자리가 지목한 축이 기본 축을 대신한다", async () => {
    setDefaultAgentBackend("ts");
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await request("/api/agent/chat/threads/t-1/messages", undefined, {
      timeoutMs: 0,
      backend: "python",
    });

    expect(fetchMock.mock.calls[0]?.[0] as string).toMatch(/messages\?backend=python$/);
  });
});
