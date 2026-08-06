import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TagId, TaskId } from "~tracer-web/shared/identity.js";
import type {
  TagCreateInput,
  TagUpdateInput,
  TagsListResponse,
  TaskTagsRecord,
} from "~tracer-web/entities/tag/model/tag.js";
import {
  createTag,
  deleteTag,
  setTaskTags,
  updateTag,
} from "~tracer-web/entities/tag/api/api-tags.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

/** 태그 자체가 바뀌면 그 태그를 단 태스크의 칩이 모두 낡는다. */
function invalidateTags(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.tagsPrefix() });
  void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.taskScopedPrefix() });
}

/** 태스크 범위 전체를 무르면 클릭 한 번에 타임라인까지 다시 읽혀 화면이 튀므로 그 태스크의 태그와 태그별 집계만 다시 읽는다. */
function invalidateTaskTags(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: TaskId,
) {
  void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.tagsPrefix() });
  void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.taskTags(taskId) });
}

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TagCreateInput) => createTag(body),
    onSettled: () => invalidateTags(queryClient),
  });
}

export function useUpdateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, body }: { readonly tagId: TagId; readonly body: TagUpdateInput }) =>
      updateTag(tagId, body),
    onSettled: () => invalidateTags(queryClient),
  });
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: TagId) => deleteTag(tagId),
    onSettled: () => invalidateTags(queryClient),
  });
}

export function useSetTaskTagsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      tagIds,
    }: {
      readonly taskId: TaskId;
      readonly tagIds: readonly TagId[];
    }) => setTaskTags(taskId, tagIds),
    // 왕복을 기다리면 체크가 늦게 켜지고 그 사이 두 번째 선택이 낡은 집합에서 출발해 먼저 고른 태그를 지우므로, 고른 결과를 먼저 캐시에 앉힌다.
    onMutate: async ({ taskId, tagIds }) => {
      const key = monitorQueryKeys.taskTags(taskId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TaskTagsRecord>(key);
      const catalog = queryClient.getQueryData<TagsListResponse>(monitorQueryKeys.tags());
      if (previous !== undefined && catalog !== undefined) {
        const wanted = new Set<TagId>(tagIds);
        queryClient.setQueryData<TaskTagsRecord>(key, {
          ...previous,
          tags: catalog.tags.filter((tag) => wanted.has(tag.id)),
        });
      }
      return { key, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous === undefined) return;
      queryClient.setQueryData<TaskTagsRecord>(context.key, context.previous);
    },
    onSettled: (_data, _error, { taskId }) => invalidateTaskTags(queryClient, taskId),
  });
}
