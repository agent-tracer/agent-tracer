import { describe, expect, it } from "vitest";
import {
  collectAgentSurface,
  EMPTY_AGENT_SURFACE,
  hasAgentPath,
} from "~tracer-web/entities/agent-surface/model/agent-surface.js";

describe("agent-surface", () => {
  it("얹힌 라우트의 경로를 표면으로 모은다", () => {
    const surface = collectAgentSurface([
      { path: "chat" },
      { path: "chat/:threadId" },
      { path: "jobs" },
    ]);

    expect(surface.paths).toEqual(["chat", "chat/:threadId", "jobs"]);
  });

  it("경로 없는 라우트를 표면에서 제외한다", () => {
    expect(collectAgentSurface([{ index: true }]).paths).toEqual([]);
  });

  it("앞의 빗금과 무관하게 같은 경로로 읽는다", () => {
    expect(hasAgentPath(collectAgentSurface([{ path: "/jobs" }]), "jobs")).toBe(true);
  });

  it("등록된 경로를 가진다고 답한다", () => {
    expect(hasAgentPath(collectAgentSurface([{ path: "chat" }]), "/chat")).toBe(true);
  });

  it("등록되지 않은 경로를 가지지 않는다고 답한다", () => {
    expect(hasAgentPath(collectAgentSurface([{ path: "chat" }]), "/jobs")).toBe(false);
  });

  it("에이전트가 배포에 없으면 어떤 경로도 가지지 않는다", () => {
    expect(hasAgentPath(EMPTY_AGENT_SURFACE, "/chat")).toBe(false);
  });
});
