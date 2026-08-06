import { useEffect, useState } from "react";
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
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

/** 제목 제안 잡의 요청과 결과 적용 및 피드백 생명주기를 소유한다. */
export function useTitleSuggestions(task: MonitoringTask) {
  const guidance = useGuidance();
  const update = useUpdateTaskMutation();
  const backend = useAgentBackendChoice();
  const enqueue = useEnqueueJob<TitleSuggestionJobInput>(
    JOB_KIND.titleSuggestion,
    backend.value,
  );
  const [open, setOpen] = useState(false);
  const [enqueueError, setEnqueueError] = useState<GuidanceMessage | null>(null);
  const currentTitle = task.displayTitle ?? task.title;
  // 패널을 닫았다고 조회를 멈추면 잡이 끝나도 그 끝이 화면에 닿을 길이 없어 요청 표시가 그대로 굳는다.
  const [watchingJob, setWatchingJob] = useState(false);
  const jobStatus = useJobStatus<TitleSuggestionJobStatus>(
    JOB_KIND.titleSuggestion,
    { taskId: task.id, enabled: open || watchingJob },
  );
  const job = jobStatus.data?.job ?? null;
  const jobActive = isActiveJobStatus(job?.status);
  useEffect(() => {
    setWatchingJob(jobActive);
  }, [jobActive]);
  const loading = enqueue.isPending || jobActive;
  const suggestions: readonly TitleSuggestion[] =
    job?.status === "completed" ? job.result?.suggestions ?? [] : [];
  // 잡이 남긴 문구는 에이전트가 지은 것이므로 그대로 두고, 요청 오류만 목록의 말로 온다.
  const error: GuidanceMessage | string | null =
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
          setEnqueueError(apiErrorMessage(guidance.messages.common, err)),
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
