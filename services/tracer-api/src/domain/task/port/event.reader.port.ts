import type { EventKind } from "@agent-tracer/kernel";
import type { EventEntity } from "@agent-tracer/tracer-model";

export const EVENT_READER = Symbol("EventReader");

/** 태스크 타임라인 이벤트 조회를 제공하는 애플리케이션 포트다. */
export interface EventReaderPort {
    findTimeline(userId: string, taskId: string, cursor: { seq: string } | undefined, limit: number): Promise<EventEntity[]>;
    findUserMessagesByTask(userId: string, taskId: string): Promise<EventEntity[]>;
    findByTaskAndKind(userId: string, taskId: string, kind: EventKind): Promise<EventEntity[]>;
}
