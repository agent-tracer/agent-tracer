import type { EventEntity } from "@agent-tracer/tracer-model";

export const TIMELINE_EVENT_READER = Symbol("TimelineEventReader");

/** 타임라인 한 장을 어느 끝에서부터 읽을지 고르는 애플리케이션 포트다. */
export interface TimelineEventReaderPort {
    /** 커서보다 늦은 이벤트를 seq 오름차순으로 준다. */
    findTimeline(
        userId: string,
        taskId: string,
        cursor: { readonly seq: string } | undefined,
        limit: number,
    ): Promise<EventEntity[]>;
    /** 커서보다 이른 이벤트를 seq 내림차순으로 준다. */
    findTimelineWindow(userId: string, taskId: string, cursor: string | undefined, limit: number): Promise<EventEntity[]>;
    countByTask(userId: string, taskId: string): Promise<number>;
}
