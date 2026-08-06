import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JOB_KIND, type JobStatus } from "~tracer-web/entities/job/model/job.js";
import type { TitleSuggestionJobStatus } from "~tracer-web/entities/job/model/title-suggestion.js";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import { TaskId, TaskSlug, WorkspacePath } from "~tracer-web/shared/identity.js";
import { createUiStore, UiStoreProvider } from "~tracer-web/shared/store/index.js";
import { useTitleSuggestions } from "~tracer-web/widgets/feed/header/title/useTitleSuggestions.js";

const enqueueMutation = { isPending: false, mutate: vi.fn() };
const updateMutation = { isPending: false, mutate: vi.fn() };
const jobStatusState: {
  data: { readonly job: TitleSuggestionJobStatus | null } | undefined;
  lastOptions: { readonly taskId?: TaskId; readonly enabled?: boolean } | undefined;
} = { data: undefined, lastOptions: undefined };

vi.mock("~tracer-web/entities/job/api/mutations.js", () => ({
  useEnqueueJob: () => enqueueMutation,
}));

vi.mock("~tracer-web/entities/task/api/edit-mutations.js", () => ({
  useUpdateTaskMutation: () => updateMutation,
}));

vi.mock("~tracer-web/entities/agent-upstream/api/queries.js", () => ({
  useAgentUpstreamsQuery: () => ({ data: { upstreams: [] } }),
}));

vi.mock("~tracer-web/entities/job/api/queries.js", () => ({
  useJobStatus: (
    _kind: string,
    options?: { readonly taskId?: TaskId; readonly enabled?: boolean },
  ) => {
    jobStatusState.lastOptions = options;
    return { data: jobStatusState.data };
  },
}));

describe("useTitleSuggestions", () => {
  afterEach(() => {
    cleanup();
    enqueueMutation.mutate.mockClear();
    updateMutation.mutate.mockClear();
    jobStatusState.data = undefined;
    jobStatusState.lastOptions = undefined;
  });

  it("패널을 닫아도 도는 잡을 계속 물어 끝을 받아낸다", () => {
    const { result, rerender } = renderSuggestions();

    act(() => result.current.suggest());
    jobStatusState.data = { job: job("running") };
    rerender();
    expect(result.current.loading).toBe(true);

    act(() => result.current.close());
    expect(result.current.open).toBe(false);
    expect(jobStatusState.lastOptions?.enabled).toBe(true);
    expect(result.current.loading).toBe(true);

    jobStatusState.data = { job: job("completed") };
    rerender();
    expect(result.current.loading).toBe(false);
  });

  it("잡이 끝나면 조회를 멈춘다", () => {
    const { result, rerender } = renderSuggestions();

    act(() => result.current.show());
    jobStatusState.data = { job: job("running") };
    rerender();
    act(() => result.current.close());
    expect(jobStatusState.lastOptions?.enabled).toBe(true);

    jobStatusState.data = { job: job("completed") };
    rerender();
    expect(jobStatusState.lastOptions?.enabled).toBe(false);
  });

  it("패널을 닫아도 도는 잡이 없으면 물어보지 않는다", () => {
    const { result } = renderSuggestions();

    expect(jobStatusState.lastOptions?.enabled).toBe(false);
    act(() => result.current.show());
    expect(jobStatusState.lastOptions?.enabled).toBe(true);
    act(() => result.current.close());
    expect(jobStatusState.lastOptions?.enabled).toBe(false);
  });
});

function renderSuggestions() {
  const store = createUiStore({ persisted: false });
  return renderHook(() => useTitleSuggestions(task()), {
    wrapper: ({ children }) => <UiStoreProvider store={store}>{children}</UiStoreProvider>,
  });
}

function job(status: JobStatus): TitleSuggestionJobStatus {
  return {
    id: `job-${status}`,
    kind: JOB_KIND.titleSuggestion,
    status,
    attempts: 1,
    error: null,
    modelUsed: null,
    durationMs: null,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
    result:
      status === "completed"
        ? { suggestions: [{ title: "새 제목", rationale: "의도가 분명해짐" }] }
        : null,
  };
}

function task(): MonitoringTask {
  return {
    id: TaskId("task-1"),
    title: "테스트 작업",
    slug: TaskSlug("test-task"),
    workspacePath: WorkspacePath("/tmp/agent-tracer"),
    status: "running",
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
  };
}
