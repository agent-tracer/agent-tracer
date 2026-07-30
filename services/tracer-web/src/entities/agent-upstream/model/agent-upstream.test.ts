import { describe, expect, it } from "vitest";
import {
  EMPTY_AGENT_UPSTREAM_CATALOG,
  reconcileAgentBackend,
  requiresAgentBackendChoice,
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
    expect(reconcileAgentBackend(TWO, "python")).toBe("python");
  });

  it("선언에 없는 선택을 버린다", () => {
    expect(reconcileAgentBackend(TWO, "rust")).toBeNull();
  });

  it("상류가 하나뿐이면 선택을 버린다", () => {
    expect(reconcileAgentBackend(ONE, "ts")).toBeNull();
  });
});
