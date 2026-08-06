import type { TaskId } from "~tracer-web/shared/identity.js";
import { deleteRequest, postJson } from "~tracer-web/shared/api/client/json-methods.js";

export interface SplitTaskTurnsInput {
  readonly sessionId: string;
  readonly fromTurnIndex: number;
  readonly toTurnIndex: number;
  readonly newTitle?: string;
  readonly targetTaskId?: string;
}

export interface SplitTaskTurnsResponse {
  readonly originTaskId: TaskId;
  readonly taskId: TaskId;
  readonly title: string;
  readonly created: boolean;
  readonly movedTurnCount: number;
}

export interface RevertTaskSplitResponse {
  readonly taskId: TaskId;
  readonly restoredTurnCount: number;
  readonly taskRemoved: boolean;
}

export function splitTaskTurns(
  taskId: TaskId,
  body: SplitTaskTurnsInput,
): Promise<SplitTaskTurnsResponse> {
  return postJson<SplitTaskTurnsResponse>(`/api/v1/tasks/${taskId}/turns/split`, body);
}

export function revertTaskSplit(taskId: TaskId): Promise<RevertTaskSplitResponse> {
  return deleteRequest<RevertTaskSplitResponse>(`/api/v1/tasks/${taskId}/split`);
}
