import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgentUpstreamCatalog } from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { AgentBackendSelect } from "~tracer-web/features/agent-backend/AgentBackendSelect.js";

const catalogState: { data: AgentUpstreamCatalog | undefined } = { data: undefined };

vi.mock("~tracer-web/entities/agent-upstream/api/queries.js", () => ({
  useAgentUpstreamsQuery: () => ({ data: catalogState.data }),
}));

function queryControl(): HTMLSelectElement | null {
  return screen.queryByRole<HTMLSelectElement>("combobox", { name: "Agent backend" });
}

afterEach(() => {
  cleanup();
  catalogState.data = undefined;
});

describe("AgentBackendSelect", () => {
  it("상류가 하나면 보이지 않는다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }] };

    render(<AgentBackendSelect value={null} onChange={vi.fn()} />);

    expect(queryControl()).toBeNull();
  });

  it("에이전트가 배포에 없으면 보이지 않는다", () => {
    catalogState.data = { upstreams: [] };

    render(<AgentBackendSelect value={null} onChange={vi.fn()} />);

    expect(queryControl()).toBeNull();
  });

  it("목록이 오기 전에는 보이지 않는다", () => {
    render(<AgentBackendSelect value={null} onChange={vi.fn()} />);

    expect(queryControl()).toBeNull();
  });

  it("선언된 이름만 고를 수 있게 낸다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    render(<AgentBackendSelect value="ts" onChange={vi.fn()} />);

    expect(
      [...(queryControl() as HTMLSelectElement).querySelectorAll("option")].map(
        (option) => option.value,
      ),
    ).toEqual(["ts", "python"]);
  });

  it("고른 이름을 부르는 자리에 넘긴다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };
    const onChange = vi.fn();

    render(<AgentBackendSelect value="ts" onChange={onChange} />);
    fireEvent.change(queryControl() as HTMLSelectElement, { target: { value: "python" } });

    expect(onChange).toHaveBeenCalledWith("python");
  });

  it("자리가 잠겨 있으면 고르지 못한다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    render(<AgentBackendSelect value="ts" onChange={vi.fn()} disabled />);

    expect(queryControl()?.disabled).toBe(true);
  });
});
