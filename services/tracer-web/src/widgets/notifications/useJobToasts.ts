import { useCallback } from "react";
import { JOB_KIND, JOB_STATUS, type JobKind, type JobStatus } from "~tracer-web/entities/job/model/job.js";
import { useToastStore } from "~tracer-web/widgets/notifications/toastStore.js";

// app 계층의 실시간 메시지 계약을 그대로 참조하면 위젯이 상위 계층을 알게
// 되므로, 이 위젯이 실제로 쓰는 조각만 로컬로 되풀이한다.
interface JobUpdatedPayload {
  readonly kind: JobKind;
  readonly status: JobStatus;
  readonly taskId?: string;
  readonly jobId?: string;
  readonly summary?: string;
  readonly error?: string;
  readonly durationMs?: number;
}

interface RealtimeMessageLike {
  readonly type: string;
  readonly payload: unknown;
}

const KIND_LABEL: Readonly<Record<JobKind, string>> = {
  [JOB_KIND.titleSuggestion]: "Title suggestion",
  [JOB_KIND.taskCleanup]: "Task cleanup",
  [JOB_KIND.recipeScan]: "Recipe scan",
};

/** `job.updated` WS 메시지를 구독해 앱 내 토스트로 보여준다. */
export function useJobToasts(): (msg: RealtimeMessageLike) => void {
  const push = useToastStore((s) => s.push);

  return useCallback(
    (msg) => {
      if (msg.type !== "job.updated") return;
      const payload = msg.payload as JobUpdatedPayload;
      if (!isToastableJobStatus(payload.status)) return;
      const title = formatTitle(payload);
      const body = formatBody(payload);

      push({
        tone: payload.status === JOB_STATUS.failed ? "error" : "success",
        title,
        ...(body ? { body } : {}),
      });
    },
    [push],
  );
}

function isToastableJobStatus(status: JobUpdatedPayload["status"]): boolean {
  return status === JOB_STATUS.completed || status === JOB_STATUS.failed;
}

function formatTitle(payload: JobUpdatedPayload): string {
  const label = KIND_LABEL[payload.kind];
  return payload.status === JOB_STATUS.failed
    ? `${label} failed`
    : `${label} complete`;
}

function formatBody(payload: JobUpdatedPayload): string | undefined {
  if (payload.status === JOB_STATUS.failed) return payload.error;
  return payload.summary;
}
