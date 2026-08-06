import type { TurnDto, TurnSplitRangeDto } from "@agent-tracer/kernel";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { TaskOpenInferenceResponse } from "~tracer-web/entities/task/model/openinference.js";
import type {
  TaskChildrenResponse,
  TaskDetailResponse,
  TaskBoundarySuggestion,
  TaskTurnsResponse,
  TaskUserInput,
} from "~tracer-web/entities/task/model/task-query.js";
import type { TaskVerification } from "~tracer-web/entities/task/model/timeline/verification.js";
import { getJson } from "~tracer-web/shared/api/client/json-methods.js";
import { toTurnSummary } from "~tracer-web/entities/task/api/task.mapper.js";

export function fetchTaskDetail(taskId: TaskId): Promise<TaskDetailResponse> {
  return getJson<TaskDetailResponse>(`/api/v1/tasks/${taskId}`);
}

export async function fetchTaskUserInputs(
  taskId: TaskId,
): Promise<readonly TaskUserInput[]> {
  const response = await getJson<{ readonly items: readonly TaskUserInput[] }>(
    `/api/v1/tasks/${taskId}/user-inputs`,
  );
  return response.items;
}

export async function fetchTaskChildren(taskId: TaskId): Promise<TaskChildrenResponse> {
  const response = await getJson<{ readonly items: TaskChildrenResponse["tasks"] }>(
    `/api/v1/tasks/${taskId}/children`,
  );
  return { tasks: response.items };
}

export async function fetchTaskTurns(taskId: TaskId): Promise<TaskTurnsResponse> {
  const response = await getJson<{
    readonly items: readonly TurnDto[];
    readonly splits?: readonly TurnSplitRangeDto[];
  }>(`/api/v1/tasks/${taskId}/turns`);
  return { turns: response.items.map(toTurnSummary), splits: response.splits ?? [] };
}

export async function fetchTaskBoundaries(
  taskId: TaskId,
): Promise<readonly TaskBoundarySuggestion[]> {
  const response = await getJson<{ readonly items: readonly TaskBoundarySuggestion[] }>(
    `/api/v1/tasks/${taskId}/boundaries`,
  );
  return response.items;
}

export async function fetchTaskVerifications(
  taskId: TaskId,
): Promise<readonly TaskVerification[]> {
  const response = await getJson<{ readonly items: readonly TaskVerification[] }>(
    `/api/v1/tasks/${taskId}/verifications`,
  );
  return response.items;
}

export function fetchTaskOpenInference(
  taskId: TaskId,
): Promise<TaskOpenInferenceResponse> {
  return getJson<TaskOpenInferenceResponse>(
    `/api/v1/tasks/${taskId}/openinference`,
  );
}
