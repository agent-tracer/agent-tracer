import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CleanupSuggestion } from "~tracer-web/entities/task-cleanup/model/task-cleanup.js";
import type {
  TaskCleanupJobInput,
  TaskCleanupJobStatus,
} from "~tracer-web/entities/job/model/task-cleanup-job.js";
import {
  useAcceptCleanupSuggestionMutation,
  useDismissCleanupSuggestionMutation,
} from "~tracer-web/entities/task-cleanup/api/mutations.js";
import { useEnqueueJob } from "~tracer-web/entities/job/api/mutations.js";
import { AgentBackendSelect } from "~tracer-web/features/agent-backend/AgentBackendSelect.js";
import { useAgentBackendChoice } from "~tracer-web/features/agent-backend/use-agent-backend-choice.js";
import { useJobStatus } from "~tracer-web/entities/job/api/queries.js";
import { useTaskCleanupSuggestionsQuery } from "~tracer-web/entities/task-cleanup/api/queries.js";
import { useTasksQuery } from "~tracer-web/entities/task/api/list-queries.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";
import { JOB_KIND, isActiveJobStatus } from "~tracer-web/entities/job/model/job.js";
import { GuidanceText, Modal } from "~tracer-web/shared/ui/index.js";
import { formatRelativeShort } from "~tracer-web/shared/lib/formatting/time.js";
import { useNowMs } from "~tracer-web/shared/lib/hooks/use-now-ms.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface TaskCleanupModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function TaskCleanupModal({ open, onClose }: TaskCleanupModalProps) {
  const guidance = useGuidance();
  const queryClient = useQueryClient();
  const latestJob = useJobStatus<TaskCleanupJobStatus>(JOB_KIND.taskCleanup, {
    enabled: open,
  });
  const suggestions = useTaskCleanupSuggestionsQuery("pending");
  const tasksQuery = useTasksQuery("all");
  const backend = useAgentBackendChoice();
  const enqueueMutation = useEnqueueJob<TaskCleanupJobInput>(
    JOB_KIND.taskCleanup,
    backend.value,
  );
  const nowMs = useNowMs(5_000);

  const taskTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasksQuery.data?.tasks ?? []) {
      map.set(t.id, t.displayTitle ?? t.title);
    }
    return map;
  }, [tasksQuery.data]);

  const archiveSuggestions = suggestions.data?.suggestions ?? [];

  const job = latestJob.data?.job ?? null;
  const isScanning = isActiveJobStatus(job?.status);
  // 상태만 보면 연달아 끝난 두 스캔이 같은 값이라 두 번째 제안을 읽지 못한다.
  const completedScanId = job?.status === "completed" ? job.id : null;

  useEffect(() => {
    // 스캔이 끝나면 새로 생성된 제안을 다시 불러온다.
    if (completedScanId === null) return;
    void queryClient.invalidateQueries({
      queryKey: monitorQueryKeys.taskCleanupSuggestionsPrefix(),
    });
  }, [completedScanId, queryClient]);

  const failureMessage = enqueueMutation.isError
    ? readErrorMessage(enqueueMutation.error)
    : job?.status === "failed"
      ? job.error || "Last scan failed"
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Archive suggestions"
      description={guidance.messages.tasks.cleanupIntroduction}
      descriptionLocale={guidance.locale}
      maxWidth={620}
    >
      <div className="py-3 px-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isScanning || enqueueMutation.isPending}
              onClick={() => {
                enqueueMutation.mutate({ filters: {} });
              }}
              className={cn(
                "py-1.5 px-3 rounded-sm border border-hair text-[12.5px] font-medium",
                isScanning || enqueueMutation.isPending
                  ? "bg-s2 text-ink-subtle cursor-not-allowed"
                  : "bg-primary text-canvas cursor-pointer",
              )}
            >
              {isScanning ? "Scanning…" : "Scan tasks"}
            </button>
            <AgentBackendSelect
              value={backend.value}
              onChange={backend.select}
              disabled={isScanning || enqueueMutation.isPending}
              className="min-w-[154px]"
            />
          </div>
          <span className="font-mono text-[11px] text-ink-tertiary">
            {job
              ? `Last scan ${formatRelativeShort(job.completedAt ?? job.createdAt, nowMs)} · ${archiveSuggestions.length} archive suggestion${archiveSuggestions.length === 1 ? "" : "s"} · ${job.tasksScanned} tasks`
              : "No scan yet"}
          </span>
        </div>
        {failureMessage && (
          <div className="py-2 px-2.5 rounded-sm border border-err text-err text-xs mb-3 break-words">
            {failureMessage}
          </div>
        )}
        <SuggestionList
          suggestions={archiveSuggestions}
          isLoading={suggestions.isLoading}
          taskTitleById={taskTitleById}
        />
      </div>
    </Modal>
  );
}

function SuggestionList({
  suggestions,
  isLoading,
  taskTitleById,
}: {
  readonly suggestions: readonly CleanupSuggestion[];
  readonly isLoading: boolean;
  readonly taskTitleById: ReadonlyMap<string, string>;
}) {
  const guidance = useGuidance();
  if (isLoading) {
    return <p className="text-xs text-ink-subtle">Loading suggestions…</p>;
  }
  if (suggestions.length === 0) {
    return (
      <GuidanceText
        as="p"
        className="text-xs text-ink-subtle"
        locale={guidance.locale}
        message={guidance.messages.tasks.cleanupEmpty}
      />
    );
  }
  return (
    <ul className="list-none p-0 m-0 grid gap-2 min-w-0">
      {suggestions.map((s) => (
        <li key={s.id} className="min-w-0">
          <SuggestionRow suggestion={s} taskTitle={taskTitleById.get(s.taskId) ?? s.taskId} />
        </li>
      ))}
    </ul>
  );
}

function SuggestionRow({
  suggestion,
  taskTitle,
}: {
  readonly suggestion: CleanupSuggestion;
  readonly taskTitle: string;
}) {
  const guidance = useGuidance();
  const accept = useAcceptCleanupSuggestionMutation();
  const dismiss = useDismissCleanupSuggestionMutation();
  const [error, setError] = useState<GuidanceMessage | null>(null);
  const isBusy = accept.isPending || dismiss.isPending;

  const handleAccept = () => {
    setError(null);
    accept.mutate(suggestion.id, {
      onError: (err: unknown) => setError(apiErrorMessage(guidance.messages.common, err)),
    });
  };
  const handleDismiss = () => {
    setError(null);
    dismiss.mutate(suggestion.id);
  };

  return (
    <div className="border border-hair rounded-sm py-2.5 px-3 bg-s2 min-w-0">
      <div className="flex items-center gap-2 mb-1 min-w-0">
        <span className="text-[12.5px] font-semibold text-ink truncate min-w-0 flex-1" title={taskTitle}>
          {taskTitle}
        </span>
      </div>
      <p className="mt-0 mb-1.5 text-xs text-ink-subtle [overflow-wrap:anywhere] break-words leading-[1.45]">
        {suggestion.rationale}
      </p>
      {error && (
        <GuidanceText
          as="p"
          className="mt-1 mb-0 text-[11.5px] text-err [overflow-wrap:anywhere]"
          locale={guidance.locale}
          message={error}
        />
      )}
      <div className="mt-2 flex gap-1.5 justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isBusy}
          className={cn(
            "py-1 px-2.5 rounded-xs border border-hair bg-transparent text-ink-subtle text-[11.5px]",
            isBusy ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={isBusy}
          className={cn(
            "py-1 px-2.5 rounded-xs border border-primary bg-primary text-canvas text-[11.5px] font-medium",
            isBusy ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          Archive
        </button>
      </div>
    </div>
  );
}

function readErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
