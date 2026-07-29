import type { CleanupSuggestionDto } from "@agent-tracer/kernel";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { CleanupSuggestion } from "~tracer-web/entities/task-cleanup/model/task-cleanup.js";

export function toCleanupSuggestion(item: CleanupSuggestionDto): CleanupSuggestion {
  return {
    id: item.id,
    jobId: item.jobId,
    taskId: item.taskId as TaskId,
    kind: item.kind,
    currentValue: item.currentValue,
    proposedValue: item.proposedValue,
    rationale: item.rationale,
    status: item.status,
    ...(item.error !== null ? { error: item.error } : {}),
    createdAt: item.createdAt,
    ...(item.resolvedAt !== null ? { resolvedAt: item.resolvedAt } : {}),
  };
}
