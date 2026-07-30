import { beforeEach, describe, expect, it, vi } from "vitest";
import { getJson } from "~tracer-web/shared/api/client/json-methods.js";
import { fetchAgentUpstreams } from "~tracer-web/entities/agent-upstream/api/api-agent-upstreams.js";

vi.mock("~tracer-web/shared/api/client/json-methods.js", () => ({
  getJson: vi.fn(),
}));

const mockGetJson = vi.mocked(getJson);

beforeEach(() => {
  mockGetJson.mockReset();
});

describe("fetchAgentUpstreams", () => {
  it("게이트웨이의 목록 창구를 부른다", async () => {
    mockGetJson.mockResolvedValue({ upstreams: [{ name: "ts" }] });

    const catalog = await fetchAgentUpstreams();

    expect(mockGetJson).toHaveBeenCalledWith("/api/agent/upstreams");
    expect(catalog.upstreams).toEqual([{ name: "ts" }]);
  });

  it("에이전트가 배포에 없으면 빈 목록을 낸다", async () => {
    const error = Object.assign(new Error("not installed"), { status: 501 });
    mockGetJson.mockRejectedValue(error);

    await expect(fetchAgentUpstreams()).resolves.toEqual({ upstreams: [] });
  });

  it("그 밖의 실패는 그대로 올린다", async () => {
    mockGetJson.mockRejectedValue(Object.assign(new Error("bad gateway"), { status: 502 }));

    await expect(fetchAgentUpstreams()).rejects.toThrow("bad gateway");
  });
});
