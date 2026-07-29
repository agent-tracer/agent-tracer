import type { EventEntity } from "@agent-tracer/tracer-model";

export const TIMELINE_EVENT_READER = Symbol("TimelineEventReader");

/** 타임라인 윈도우를 seq 내림차순으로 읽는 애플리케이션 포트다. */
export interface TimelineEventReaderPort {
    findTimelineWindow(userId: string, taskId: string, cursor: string | undefined, limit: number): Promise<EventEntity[]>;
}
