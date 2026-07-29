import type { JobStatusBase } from "~tracer-web/entities/job/model/job.js";

export interface TaskCleanupJobInput {
  readonly filters: Record<string, unknown>;
}

export interface TaskCleanupJobStatus extends JobStatusBase {
  readonly suggestionsCreated: number;
  readonly tasksScanned: number;
}
