import type { EventEntity } from "@agent-tracer/tracer-model";
import type { TimelineEventReaderPort } from "../event.reader.port.js";

/** 타임라인 이벤트 포트의 인메모리 대역이다. */
export class InMemoryTimelineEventReader implements TimelineEventReaderPort {
    private readonly rows: EventEntity[] = [];

    seed(...events: readonly EventEntity[]): void {
        this.rows.push(...events);
    }

    all(): readonly EventEntity[] {
        return [...this.rows];
    }

    findTimeline(
        userId: string,
        taskId: string,
        cursor: { readonly seq: string } | undefined,
        limit: number,
    ): Promise<EventEntity[]> {
        const page = this.ownedBy(userId, taskId)
            .filter((event) => cursor === undefined || BigInt(event.seq) > BigInt(cursor.seq))
            .sort((left, right) => (BigInt(left.seq) > BigInt(right.seq) ? 1 : -1))
            .slice(0, limit);
        return Promise.resolve(page);
    }

    countByTask(userId: string, taskId: string): Promise<number> {
        return Promise.resolve(this.ownedBy(userId, taskId).length);
    }

    findTimelineWindow(userId: string, taskId: string, cursor: string | undefined, limit: number): Promise<EventEntity[]> {
        const page = this.ownedBy(userId, taskId)
            .filter((event) => cursor === undefined || BigInt(event.seq) < BigInt(cursor))
            .sort((left, right) => (BigInt(left.seq) < BigInt(right.seq) ? 1 : -1))
            .slice(0, limit);
        return Promise.resolve(page);
    }

    // seq는 원장 BIGSERIAL이라 문자열이 아니라 정수로 비교한다.
    private ownedBy(userId: string, taskId: string): EventEntity[] {
        return this.rows.filter((event) => event.userId === userId && event.taskId === taskId);
    }
}
