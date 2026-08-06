import type { TaskEntity } from "@agent-tracer/tracer-model";

export const SPLIT_TASK_READER = Symbol("SplitTaskReader");

/** `tasks` 색인을 원장에서 다시 채울 때 살아나지 못하는 분리 태스크를 읽기 모델에서 읽는 포트다. */
export interface SplitTaskReaderPort {
    findSplitTasks(): Promise<readonly TaskEntity[]>;
    findArchivedTaskIds(): Promise<ReadonlySet<string>>;
}
