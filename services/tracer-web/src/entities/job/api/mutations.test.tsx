import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { JobDto } from "@agent-tracer/kernel";
import { JOB_KIND } from "~tracer-web/entities/job/model/job.js";
import { enqueueJob } from "~tracer-web/entities/job/api/api-jobs.js";
import { useEnqueueJob } from "~tracer-web/entities/job/api/mutations.js";
import { TaskId } from "~tracer-web/shared/identity.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

vi.mock("~tracer-web/entities/job/api/api-jobs.js", () => ({
  enqueueJob: vi.fn(),
  cancelJob: vi.fn(),
}));

const mockEnqueueJob = vi.mocked(enqueueJob);

afterEach(() => {
  cleanup();
  mockEnqueueJob.mockReset();
});

describe("useEnqueueJob", () => {
  it("접수한 잡을 그 종류의 최신 잡으로 곧바로 앉힌다", async () => {
    const client = newClient();
    // 직전에 끝난 잡이 최신으로 남아 있다.
    client.setQueryData(monitorQueryKeys.latestJob(JOB_KIND.titleSuggestion, TaskId("task-1")), {
      job: { id: "job-old", status: "completed" },
    });
    mockEnqueueJob.mockResolvedValue({ job: dto() });

    const { result } = renderHook(() => useEnqueueJob<{ taskId: TaskId }>(JOB_KIND.titleSuggestion), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(async () => {
      await result.current.mutateAsync({ taskId: TaskId("task-1") });
    });

    expect(
      client.getQueryData(monitorQueryKeys.latestJob(JOB_KIND.titleSuggestion, TaskId("task-1"))),
    ).toMatchObject({ job: { id: "job-new", status: "pending" } });
    expect(client.getQueryData(monitorQueryKeys.latestJob(JOB_KIND.titleSuggestion))).toMatchObject({
      job: { id: "job-new", status: "pending" },
    });
  });

  it("태스크에 매이지 않은 잡은 종류별 최신 자리만 채운다", async () => {
    const client = newClient();
    mockEnqueueJob.mockResolvedValue({ job: { ...dto(), taskId: null } });

    const { result } = renderHook(() => useEnqueueJob<{ filters: object }>(JOB_KIND.taskCleanup), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(async () => {
      await result.current.mutateAsync({ filters: {} });
    });

    expect(client.getQueryData(monitorQueryKeys.latestJob(JOB_KIND.taskCleanup))).toMatchObject({
      job: { id: "job-new", status: "pending" },
    });
  });
});

function newClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
}

function dto(): JobDto {
  return {
    id: "job-new",
    userId: "user-1",
    kind: JOB_KIND.titleSuggestion,
    executor: "temporal",
    status: "pending",
    attempts: 0,
    taskId: "task-1",
    input: {},
    result: {},
    usage: {},
    error: null,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
  };
}
