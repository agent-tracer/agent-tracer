import type { JobStatusBase } from "~tracer-web/entities/job/model/job.js";
import type { TaskId } from "~tracer-web/shared/identity.js";

export interface RecipeScanJobInput {
  readonly taskId: TaskId;
  readonly userPrompt?: string;
  readonly language?: string;
}

export interface RecipeScanJobStatus extends JobStatusBase {
  // 에이전트가 낸 후보가 그대로 실리며 화면은 건수를 이 목록에서 센다.
  readonly recipes: readonly unknown[];
  readonly taskId: TaskId;
  readonly language: string | null;
}
