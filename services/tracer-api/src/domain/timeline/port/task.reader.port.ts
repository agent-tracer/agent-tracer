import type { TaskEntity } from "@agent-tracer/tracer-model";

export const TIMELINE_TASK_READER = Symbol("TimelineTaskReader");

/** 타임라인 조회가 소유권을 확인할 때 쓰는 태스크 읽기 포트다. */
export interface TimelineTaskReaderPort {
    findById(userId: string, id: string): Promise<TaskEntity | null>;
}
