import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { collectAgentSurface } from "~tracer-web/entities/agent-surface/model/agent-surface.js";
import { AgentSurfaceProvider } from "~tracer-web/entities/agent-surface/model/AgentSurfaceProvider.js";
import { createUiStore, UiStoreProvider } from "~tracer-web/shared/store/index.js";
import { TooltipProvider } from "~tracer-web/shared/ui/index.js";
import { TopActions } from "~tracer-web/widgets/topbar/TopActions.js";

vi.mock("~tracer-web/entities/recipe/api/queries.js", () => ({
  useRecipesQuery: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("~tracer-web/entities/rule/api/queries.js", () => ({
  useRulesQuery: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("~tracer-web/entities/memo/api/queries.js", () => ({
  useMemosQuery: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("~tracer-web/entities/tag/api/queries.js", () => ({
  useTagsQuery: () => ({ data: undefined, isLoading: false }),
}));

const AGENT_ROUTES = [
  { path: "chat" },
  { path: "chat/:threadId" },
  { path: "jobs" },
  { path: "evaluation" },
];

function renderWithRoutes(routes: { path: string }[]) {
  render(
    <MemoryRouter>
      <UiStoreProvider store={createUiStore()}>
        <TooltipProvider>
          <AgentSurfaceProvider surface={collectAgentSurface(routes)}>
            <TopActions />
          </AgentSurfaceProvider>
        </TooltipProvider>
      </UiStoreProvider>
    </MemoryRouter>,
  );
}

function agentLabels(): (string | null)[] {
  return ["Chat with the agent", "Agent jobs", "Evaluation workspace"].map(
    (name) => screen.queryByRole("button", { name })?.textContent ?? null,
  );
}

afterEach(cleanup);

describe("TopActions", () => {
  it("에이전트 라우트가 얹히면 그 화면으로 가는 단추를 낸다", () => {
    renderWithRoutes(AGENT_ROUTES);

    expect(agentLabels()).toEqual(["Chat", "Jobs", "Evaluate"]);
  });

  it("에이전트가 배포에 없으면 그 화면으로 가는 단추를 내지 않는다", () => {
    renderWithRoutes([]);

    expect(agentLabels()).toEqual([null, null, null]);
  });

  it("얹히지 않은 라우트의 단추만 내지 않는다", () => {
    renderWithRoutes([{ path: "chat" }]);

    expect(agentLabels()).toEqual(["Chat", null, null]);
  });

  it("에이전트가 배포에 없어도 추적 화면으로 가는 단추는 낸다", () => {
    renderWithRoutes([]);

    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeNull();
  });
});
