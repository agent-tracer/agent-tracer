import type { AgentBackendJobInput, JobStatusBase } from "~tracer-web/entities/job/model/job.js";
import type { TaskId } from "~tracer-web/shared/identity.js";

export interface RecipeScanJobInput extends AgentBackendJobInput {
  readonly taskId: TaskId;
  readonly userPrompt?: string;
  readonly language?: string;
}

export interface RecipeScanJobStatus extends JobStatusBase {
  readonly candidatesCreated: number;
  readonly sourceTaskId: TaskId;
  readonly language: string | null;
}
