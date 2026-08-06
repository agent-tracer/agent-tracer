import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskId } from "~tracer-web/shared/identity.js";
import {
  revertTaskSplit,
  splitTaskTurns,
  type SplitTaskTurnsInput,
} from "~tracer-web/entities/task/api/split.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

/** 분리는 두 태스크의 턴·이벤트를 모두 옮기므로 목록과 양쪽 상세를 함께 무효화한다. */
function invalidateSplit(
  queryClient: ReturnType<typeof useQueryClient>,
  taskIds: readonly TaskId[],
): void {
  void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.tasksPrefix() });
  for (const taskId of taskIds) {
    void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.taskDetail(taskId) });
  }
}

export function useSplitTaskTurnsMutation(taskId: TaskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SplitTaskTurnsInput) => splitTaskTurns(taskId, input),
    onSuccess: (result) => {
      invalidateSplit(queryClient, [result.originTaskId, result.taskId]);
    },
  });
}

export function useRevertTaskSplitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: TaskId) => revertTaskSplit(taskId),
    onSuccess: (result, taskId) => {
      invalidateSplit(queryClient, [taskId, result.taskId]);
    },
  });
}
