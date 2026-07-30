import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AgentUpstreamCatalog } from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { AgentBackendSelect } from "~tracer-web/features/agent-backend/AgentBackendSelect.js";
import { getAgentBackend, setAgentBackend } from "~tracer-web/shared/api/agent-backend.js";
import { TooltipProvider } from "~tracer-web/shared/ui/index.js";

const catalogState: { data: AgentUpstreamCatalog | undefined } = { data: undefined };

vi.mock("~tracer-web/entities/agent-upstream/api/queries.js", () => ({
  useAgentUpstreamsQuery: () => ({ data: catalogState.data }),
}));

function renderSelect(client: QueryClient = new QueryClient()) {
  render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AgentBackendSelect />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

function queryControl(): HTMLElement | null {
  return screen.queryByRole("combobox", { name: "Agent backend" });
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

    expect(queryControl()).toBeNull();
  });

  it("에이전트가 배포에 없으면 선택을 보이지 않는다", () => {
    catalogState.data = { upstreams: [] };

    renderSelect();

    expect(queryControl()).toBeNull();
  });

  it("목록이 오기 전에는 저장된 선택을 지우지 않는다", () => {
    setAgentBackend("python");
    catalogState.data = undefined;

    renderSelect();

    expect(queryControl()).toBeNull();
    expect(getAgentBackend()).toBe("python");
  });

  it("새로 연 화면이 첫 상류를 고른 채로 선다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();

    expect(getAgentBackend()).toBe("ts");
    expect((queryControl() as HTMLSelectElement).value).toBe("ts");
  });

  it("저장된 선택을 그대로 이어서 보인다", () => {
    setAgentBackend("python");
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();

    expect(getAgentBackend()).toBe("python");
    expect((queryControl() as HTMLSelectElement).value).toBe("python");
  });

  it("선언된 이름만 고를 수 있게 낸다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();

    expect(
      [...(queryControl() as HTMLSelectElement).querySelectorAll("option")].map(
        (option) => option.value,
      ),
    ).toEqual(["ts", "python"]);
  });

  it("무엇을 고르는 것인지 이름을 함께 보인다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();

    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("고른 상류를 요청 층에 넘긴다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();
    fireEvent.change(queryControl() as HTMLSelectElement, { target: { value: "python" } });

    expect(getAgentBackend()).toBe("python");
  });

  it("축을 바꿔도 열려 있던 대화를 버리지 않고 다시 읽기만 한다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };
    const client = new QueryClient();
    const conversation = ["monitor", "chat", "messages", "thread-1"];
    client.setQueryData(conversation, { messages: ["안녕"] });

    renderSelect(client);
    fireEvent.change(queryControl() as HTMLSelectElement, { target: { value: "python" } });

    expect(client.getQueryData(conversation)).toEqual({ messages: ["안녕"] });
    expect(client.getQueryState(conversation)?.isInvalidated).toBe(true);
  });

  it("상류가 하나로 줄면 남아 있던 선택을 버린다", () => {
    setAgentBackend("python");
    catalogState.data = { upstreams: [{ name: "ts" }] };

    renderSelect();

    expect(getAgentBackend()).toBeNull();
  });

  it("선언에서 사라진 선택을 첫 상류로 되돌린다", () => {
    setAgentBackend("rust");
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    renderSelect();

    expect(getAgentBackend()).toBe("ts");
  });
});
