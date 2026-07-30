import { useState } from "react";
import { JOB_KIND, isActiveJobStatus } from "~tracer-web/entities/job/model/job.js";
import type {
  TitleSuggestion,
  TitleSuggestionJobInput,
  TitleSuggestionJobStatus,
} from "~tracer-web/entities/job/model/title-suggestion.js";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import {
  useEnqueueJob,
} from "~tracer-web/entities/job/api/mutations.js";
import { useJobStatus } from "~tracer-web/entities/job/api/queries.js";
import { useUpdateTaskMutation } from "~tracer-web/entities/task/api/edit-mutations.js";
import { useAgentBackendChoice } from "~tracer-web/features/agent-backend/use-agent-backend-choice.js";

/** 제목 제안 잡의 요청과 결과 적용 및 피드백 생명주기를 소유한다. */
export function useTitleSuggestions(task: MonitoringTask) {
  const update = useUpdateTaskMutation();
  const backend = useAgentBackendChoice();
  const enqueue = useEnqueueJob<TitleSuggestionJobInput>(
    JOB_KIND.titleSuggestion,
    backend.value,
  );
  const [open, setOpen] = useState(false);
  const [enqueueError, setEnqueueError] = useState<string | null>(null);
  const currentTitle = task.displayTitle ?? task.title;
  const jobStatus = useJobStatus<TitleSuggestionJobStatus>(
    JOB_KIND.titleSuggestion,
    { taskId: task.id, enabled: open },
  );
  const job = jobStatus.data?.job ?? null;
  const loading = enqueue.isPending || isActiveJobStatus(job?.status);
  const suggestions: readonly TitleSuggestion[] =
    job?.status === "completed" ? job.result?.suggestions ?? [] : [];
  const error =
    enqueueError ?? (job?.status === "failed" ? job.error : null);

  const show = () => {
    setEnqueueError(null);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEnqueueError(null);
  };

  const suggest = () => {
    setEnqueueError(null);
    setOpen(true);
    enqueue.mutate(
      { taskId: task.id },
      {
        onError: (err: unknown) =>
          setEnqueueError(err instanceof Error ? err.message : String(err)),
      },
    );
  };

  const apply = (title: string) => {
    update.mutate(
      { taskId: task.id, body: { title } },
      { onSettled: close },
    );
  };

  return {
    open,
    loading,
    error,
    suggestions,
    currentTitle,
    agentBackend: backend.value,
    onAgentBackendChange: backend.select,
    show,
    close,
    suggest,
    apply,
  } as const;
}
