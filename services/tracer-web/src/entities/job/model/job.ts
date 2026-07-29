import type { JobKind, JobStatus } from "@agent-tracer/kernel";
import { JOB_KIND, JOB_STATUS } from "@agent-tracer/kernel";

export type { JobKind, JobStatus };
export { JOB_KIND, JOB_STATUS };

export const JOB_STATUSES: readonly JobStatus[] = Object.values(JOB_STATUS);

export interface JobStatusBase {
  readonly id: string;
  readonly kind: JobKind;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly error: string | null;
  readonly modelUsed: string | null;
  readonly durationMs: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

export function isActiveJobStatus(status: JobStatus | undefined): boolean {
  return status === JOB_STATUS.pending || status === JOB_STATUS.running;
}

export function isCancelableJobStatus(status: JobStatus | undefined): boolean {
  return isActiveJobStatus(status);
}
