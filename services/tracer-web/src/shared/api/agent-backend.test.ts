import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getDefaultAgentBackend,
  setDefaultAgentBackend,
  useAgentBackendSettled,
} from "~tracer-web/shared/api/agent-backend.js";

describe("축이 정해졌는지 알리는 신호", () => {
  beforeEach(() => {
    setDefaultAgentBackend(null);
  });

  it("목록을 읽은 뒤에 정해진 것으로 본다", () => {
    const { result } = renderHook(() => useAgentBackendSettled());

    expect(result.current).toBe(true);
  });

  it("정해진 축을 요청 층이 그대로 읽는다", () => {
    setDefaultAgentBackend("python");

    expect(getDefaultAgentBackend()).toBe("python");
  });

  it("축이 하나뿐이면 지목하지 않은 것으로 정해진다", () => {
    setDefaultAgentBackend(null);

    expect(getDefaultAgentBackend()).toBeNull();
  });
});
