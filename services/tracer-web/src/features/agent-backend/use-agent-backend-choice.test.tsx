import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgentUpstreamCatalog } from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import {
  useAgentBackendChoice,
  type AgentBackendChoice,
} from "~tracer-web/features/agent-backend/use-agent-backend-choice.js";

const catalogState: { data: AgentUpstreamCatalog | undefined } = { data: undefined };

vi.mock("~tracer-web/entities/agent-upstream/api/queries.js", () => ({
  useAgentUpstreamsQuery: () => ({ data: catalogState.data }),
}));

function Probe({ report }: { readonly report: (choice: AgentBackendChoice) => void }) {
  report(useAgentBackendChoice());
  return null;
}

function mount(): { current: AgentBackendChoice } {
  const ref = { current: undefined as unknown as AgentBackendChoice };
  render(
    <Probe
      report={(choice) => {
        ref.current = choice;
      }}
    />,
  );
  return ref;
}

afterEach(() => {
  cleanup();
  catalogState.data = undefined;
});

describe("useAgentBackendChoice", () => {
  it("상류가 둘 이상이면 첫 상류로 시작한다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };

    expect(mount().current.value).toBe("ts");
  });

  it("상류가 하나면 축을 지목하지 않는다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }] };

    expect(mount().current.value).toBeNull();
  });

  it("자리마다 고른 값이 서로를 바꾸지 않는다", () => {
    catalogState.data = { upstreams: [{ name: "ts" }, { name: "python" }] };
    const left = mount();
    const right = mount();

    act(() => left.current.select("python"));

    expect(left.current.value).toBe("python");
    expect(right.current.value).toBe("ts");
  });
});
