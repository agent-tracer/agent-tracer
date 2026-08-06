import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { JobDto } from "@agent-tracer/kernel";
import type { JobKind } from "~tracer-web/entities/job/model/job.js";
import { cancelJob, enqueueJob } from "~tracer-web/entities/job/api/api-jobs.js";
import { toJobStatus } from "~tracer-web/entities/job/api/job.mapper.js";
import { TaskId } from "~tracer-web/shared/identity.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

export function useEnqueueJob<TInput>(kind: JobKind, backend?: string | null) {
  const queryClient = useQueryClient();
  const idempotencyKeysRef = useRef(new Map<string, { key: string; inFlight: number }>());
  return useMutation({
    mutationFn: async (input: TInput) => {
      const signature = createJobSubmissionSignature(kind, input);
      const idempotencyKey = acquireIdempotencyKey(idempotencyKeysRef.current, kind, signature);
      try {
        return await enqueueJob(kind, input, {
          idempotencyKey,
          ...(backend ? { backend } : {}),
        });
      } finally {
        releaseIdempotencyKey(idempotencyKeysRef.current, signature, idempotencyKey);
      }
    },
    onSuccess: (response) => seedLatestJob(queryClient, kind, response.job),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: monitorQueryKeys.latestJobPrefix(kind),
      });
    },
  });
}

/** 다시 물어보는 사이에 직전 잡이 최신으로 남으면 화면이 지난 결과를 잠깐 보이므로, 접수한 잡을 곧바로 그 종류의 최신 자리에 앉힌다. */
function seedLatestJob(queryClient: QueryClient, kind: JobKind, job: JobDto): void {
  const seeded = { job: toJobStatus(job) };
  queryClient.setQueryData(monitorQueryKeys.latestJob(kind), seeded);
  if (job.taskId !== null) {
    queryClient.setQueryData(monitorQueryKeys.latestJob(kind, TaskId(job.taskId)), seeded);
  }
}

export function useCancelJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (job: Pick<JobDto, "id">) => cancelJob(job),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.jobsHistoryPrefix() });
      void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.job(job.id) });
      void queryClient.invalidateQueries({
        queryKey: monitorQueryKeys.latestJobPrefix(job.kind),
      });
    },
  });
}

function createJobSubmissionSignature(kind: JobKind, input: unknown): string {
  return `${kind}:${stableJson(input)}`;
}

function acquireIdempotencyKey(
  entries: Map<string, { key: string; inFlight: number }>,
  kind: JobKind,
  signature: string,
): string {
  const existing = entries.get(signature);
  if (existing !== undefined) {
    existing.inFlight += 1;
    return existing.key;
  }
  const key = `${kind}:${createRandomId()}`;
  entries.set(signature, { key, inFlight: 1 });
  return key;
}

function releaseIdempotencyKey(
  entries: Map<string, { key: string; inFlight: number }>,
  signature: string,
  key: string,
): void {
  const existing = entries.get(signature);
  if (existing === undefined || existing.key !== key) return;
  existing.inFlight -= 1;
  if (existing.inFlight <= 0) entries.delete(signature);
}

function createRandomId(): string {
  return globalThis.crypto.randomUUID();
}

function stableJson(value: unknown): string {
  if (value === undefined) return "undefined";
  return JSON.stringify(toStableJsonValue(value));
}

function toStableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toStableJsonValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, toStableJsonValue(child)]),
    );
  }
  return value;
}
