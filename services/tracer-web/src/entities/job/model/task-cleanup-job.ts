import type { JobStatusBase } from "~tracer-web/entities/job/model/job.js";

export interface TaskCleanupJobInput {
  readonly filters: Record<string, unknown>;
}

export interface TaskCleanupJobStatus extends JobStatusBase {
  // 에이전트가 낸 제안이 그대로 실리며 화면은 건수를 이 목록에서 센다.
  readonly suggestions: readonly unknown[];
  readonly tasksScanned: number;
}
