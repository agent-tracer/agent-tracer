import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AgentUpstreamCatalog } from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { AgentBackendSelect } from "~tracer-web/features/agent-backend/AgentBackendSelect.js";
import { getAgentBackend, setAgentBackend } from "~tracer-web/shared/api/agent-backend.js";

const catalogState: { data: AgentUpstreamCatalog | undefined } = { data: undefined };

vi.mock("~tracer-web/entities/agent-upstream/api/queries.js", () => ({
  useAgentUpstreamsQuery: () => ({ data: catalogState.data }),
}));

function renderSelect() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AgentBackendSelect />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  setAgentBackend(null);
});

afterEach(() => {
  cleanup();
  catalogState.data = undefined;
});

describe("AgentBackendSelect", () => {
  it("상류가 하나면 선택을 보이지 않는다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }] };

    renderSelect();

    expect(screen.queryByRole("combobox", { name: "Agent backend" })).toBeNull();
  });

  it("에이전트가 배포에 없으면 선택을 보이지 않는다", () => {
    catalogState.data = { upstreams: [] };

    renderSelect();

    expect(screen.queryByRole("combobox", { name: "Agent backend" })).toBeNull();
  });

  it("상류가 둘 이상이면 선언된 이름으로 선택을 채운다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();

    const select = screen.getByRole("combobox", { name: "Agent backend" });
    expect(
      [...select.querySelectorAll("option")].map((option) => option.value),
    ).toEqual(["", "ts", "python"]);
  });

  it("고른 상류를 요청 층에 넘긴다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();
    fireEvent.change(screen.getByRole("combobox", { name: "Agent backend" }), {
      target: { value: "python" },
    });

    expect(getAgentBackend()).toBe("python");
  });

  it("상류가 하나로 줄면 남아 있던 선택을 버린다", () => {
    setAgentBackend("python");
    catalogState.data = { upstreams: [{ name: "ts" }] };

    renderSelect();

    expect(getAgentBackend()).toBeNull();
  });
});
