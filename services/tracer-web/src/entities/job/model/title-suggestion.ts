import type { JobStatusBase } from "~tracer-web/entities/job/model/job.js";
import type { TaskId } from "~tracer-web/shared/identity.js";

export interface TitleSuggestion {
  readonly title: string;
  readonly rationale: string;
}

export interface TitleSuggestionJobInput {
  readonly taskId: TaskId;
}

export interface TitleSuggestionJobStatus extends JobStatusBase {
  readonly result: {
    readonly suggestions: readonly TitleSuggestion[];
  } | null;
}
