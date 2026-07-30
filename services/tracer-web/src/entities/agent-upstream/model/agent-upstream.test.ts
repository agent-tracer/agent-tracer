import { describe, expect, it } from "vitest";
import {
  EMPTY_AGENT_UPSTREAM_CATALOG,
  requiresAgentBackendChoice,
  resolveAgentBackend,
} from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";

const TWO = { upstreams: [{ name: "ts" }, { name: "python" }] };
const ONE = { upstreams: [{ name: "ts" }] };

describe("상류 목록", () => {
  it("상류가 둘 이상일 때만 선택을 요구한다", () => {
    expect(requiresAgentBackendChoice(TWO)).toBe(true);
    expect(requiresAgentBackendChoice(ONE)).toBe(false);
    expect(requiresAgentBackendChoice(EMPTY_AGENT_UPSTREAM_CATALOG)).toBe(false);
  });

  it("선언에 있는 선택을 그대로 둔다", () => {
    expect(resolveAgentBackend(TWO, "python")).toBe("python");
  });

  it("아직 고르지 않았으면 첫 상류를 고른다", () => {
    expect(resolveAgentBackend(TWO, null)).toBe("ts");
  });

  it("선언에 없는 선택을 버리고 첫 상류로 돌아간다", () => {
    expect(resolveAgentBackend(TWO, "rust")).toBe("ts");
  });

  it("상류가 하나뿐이면 아무것도 싣지 않는다", () => {
    expect(resolveAgentBackend(ONE, "ts")).toBeNull();
    expect(resolveAgentBackend(EMPTY_AGENT_UPSTREAM_CATALOG, "ts")).toBeNull();
  });
});
