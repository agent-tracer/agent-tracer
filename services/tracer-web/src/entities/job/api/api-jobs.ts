import type { JobKind, JobStatus } from "~tracer-web/entities/job/model/job.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { AiJobStepList, JobDto, JobListDto } from "@agent-tracer/kernel";
import { getJson, postJson } from "~tracer-web/shared/api/client/json-methods.js";
import { toJobStatus } from "~tracer-web/entities/job/api/job.mapper.js";

// ─── Jobs (통합 비동기 잡) ─────────────────────────────────────────────────

// 잡은 에이전트 서비스가 소유하므로 게이트웨이의 에이전트 접두사 아래로 부른다.
const JOBS = "/api/agent/jobs";

export interface JobEnqueueResponse {
  readonly job: JobDto;
}

export interface EnqueueJobOptions {
  readonly idempotencyKey?: string;
  /** 이 접수를 받을 상류이며 부르는 자리가 고른다. */
  readonly backend?: string;
}

export function enqueueJob<TInput>(
  kind: JobKind,
  input: TInput,
  options: EnqueueJobOptions = {},
): Promise<JobEnqueueResponse> {
  return postJson<JobEnqueueResponse>(
    JOBS,
    {
      kind,
      input,
      ...(options.idempotencyKey !== undefined ? { idempotencyKey: options.idempotencyKey } : {}),
    },
    options.backend !== undefined ? { backend: options.backend } : undefined,
  );
}

export function fetchJob(jobId: string): Promise<{ readonly job: JobDto }> {
  return getJson<{ readonly job: JobDto }>(`${JOBS}/${encodeURIComponent(jobId)}`);
}

export function fetchJobSteps(jobId: string): Promise<AiJobStepList> {
  return getJson<AiJobStepList>(`${JOBS}/${encodeURIComponent(jobId)}/steps`);
}

// 종류별 최신 잡 상태.
export async function fetchLatestJob<T>(
  kind: JobKind,
  options?: { readonly taskId?: TaskId },
): Promise<{ job: T | null }> {
  const params = new URLSearchParams({ kind });
  if (options?.taskId) params.set("taskId", options.taskId);
  const res = await getJson<{ readonly job: JobDto | null }>(
    `${JOBS}/latest?${params.toString()}`,
  );
  return { job: res.job !== null ? (toJobStatus(res.job) as T) : null };
}

export interface FetchJobHistoryOptions {
  readonly kind?: JobKind;
  readonly status?: JobStatus;
  readonly limit?: number;
  readonly offset?: number;
}

// 잡 관제 화면은 원본 잡 행(input·result·usage 포함)을 그대로 다룬다.
export async function fetchJobHistory(
  options: FetchJobHistoryOptions = {},
): Promise<JobListDto> {
  const params = new URLSearchParams();
  if (options.kind) params.set("kind", options.kind);
  if (options.status) params.set("status", options.status);
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.offset !== undefined) params.set("offset", String(options.offset));
  const query = params.toString();
  return getJson<JobListDto>(`${JOBS}/history${query ? `?${query}` : ""}`);
}

export async function cancelJob(job: Pick<JobDto, "id">): Promise<JobDto> {
  const res = await postJson<{ readonly job: JobDto }>(`${JOBS}/${job.id}/cancel`, {});
  return res.job;
}
