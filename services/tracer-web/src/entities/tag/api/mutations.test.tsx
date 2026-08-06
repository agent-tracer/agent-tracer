import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  TagRecord,
  TagSummaryRecord,
  TaskTagsRecord,
} from "~tracer-web/entities/tag/model/tag.js";
import { setTaskTags } from "~tracer-web/entities/tag/api/api-tags.js";
import { useSetTaskTagsMutation } from "~tracer-web/entities/tag/api/mutations.js";
import { TagId, TaskId } from "~tracer-web/shared/identity.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

vi.mock("~tracer-web/entities/tag/api/api-tags.js", () => ({
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  setTaskTags: vi.fn(),
  updateTag: vi.fn(),
}));

const mockSetTaskTags = vi.mocked(setTaskTags);
const taskId = TaskId("task-1");

afterEach(() => {
  cleanup();
  mockSetTaskTags.mockReset();
});

describe("useSetTaskTagsMutation", () => {
  it("고른 태그를 왕복 전에 캐시에 앉힌다", async () => {
    const client = seededClient();
    let resolve = (): void => {};
    mockSetTaskTags.mockReturnValue(
      new Promise<TaskTagsRecord>((done) => {
        resolve = () => done({ taskId, tags: [tag("t1"), tag("t2")] });
      }),
    );

    const { result } = renderHook(() => useSetTaskTagsMutation(), { wrapper: wrap(client) });
    act(() => {
      result.current.mutate({ taskId, tagIds: [TagId("t1"), TagId("t2")] });
    });

    await waitFor(() => {
      expect(readTaskTagIds(client)).toEqual(["t1", "t2"]);
    });
    act(() => resolve());
  });

  it("빠른 두 번의 선택이 서로를 지우지 않는다", async () => {
    const client = seededClient();
    mockSetTaskTags.mockImplementation(async (_taskId, tagIds) => ({
      taskId,
      tags: tagIds.map((id) => tag(id)),
    }));

    const { result } = renderHook(() => useSetTaskTagsMutation(), { wrapper: wrap(client) });

    // 첫 선택이 아직 돌아오지 않은 채 두 번째 선택이 지금 캐시에서 출발한다.
    act(() => {
      result.current.mutate({ taskId, tagIds: [TagId("t1"), TagId("t2")] });
    });
    await waitFor(() => {
      expect(readTaskTagIds(client)).toEqual(["t1", "t2"]);
    });
    act(() => {
      result.current.mutate({ taskId, tagIds: [TagId("t1"), TagId("t2"), TagId("t3")] });
    });

    await waitFor(() => {
      expect(readTaskTagIds(client)).toEqual(["t1", "t2", "t3"]);
    });
  });

  it("요청이 실패하면 앉혔던 값을 되돌린다", async () => {
    const client = seededClient();
    mockSetTaskTags.mockRejectedValue(new Error("nope"));

    const { result } = renderHook(() => useSetTaskTagsMutation(), { wrapper: wrap(client) });
    act(() => {
      result.current.mutate({ taskId, tagIds: [TagId("t1"), TagId("t2")] });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(readTaskTagIds(client)).toEqual(["t1"]);
  });
});

function wrap(client: QueryClient) {
  return ({ children }: { readonly children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function seededClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  client.setQueryData(monitorQueryKeys.tags(), {
    tags: [summary("t1"), summary("t2"), summary("t3")],
  });
  client.setQueryData<TaskTagsRecord>(monitorQueryKeys.taskTags(taskId), {
    taskId,
    tags: [tag("t1")],
  });
  return client;
}

function readTaskTagIds(client: QueryClient): readonly string[] {
  const record = client.getQueryData<TaskTagsRecord>(monitorQueryKeys.taskTags(taskId));
  return (record?.tags ?? []).map((item) => item.id);
}

function tag(id: string): TagRecord {
  return {
    id: TagId(id),
    userId: "user-1",
    color: "#586069",
    name: `${id} name`,
    description: null,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
  };
}

function summary(id: string): TagSummaryRecord {
  return { ...tag(id), taskCount: 0 };
}
