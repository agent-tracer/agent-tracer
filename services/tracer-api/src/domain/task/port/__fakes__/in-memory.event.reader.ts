import { KIND, type EventKind } from "@agent-tracer/kernel";
import type { EventEntity } from "@agent-tracer/tracer-model";
import type { EventReaderPort } from "~tracer-api/domain/task/port/event.reader.port.js";

/** 이벤트 조회 포트의 인메모리 대역이다. */
export class InMemoryEventReader implements EventReaderPort {
    private readonly rows: EventEntity[] = [];

    seed(...events: readonly EventEntity[]): void {
        this.rows.push(...events);
    }

    all(): readonly EventEntity[] {
        return [...this.rows];
    }

    findTimeline(userId: string, taskId: string, cursor: { seq: string } | undefined, limit: number): Promise<EventEntity[]> {
        const rows = this.ordered(userId, taskId).filter((event) => cursor === undefined || event.seq > cursor.seq);
        return Promise.resolve(rows.slice(0, limit));
    }

    findUserMessagesByTask(userId: string, taskId: string): Promise<EventEntity[]> {
        return Promise.resolve(this.ordered(userId, taskId).filter((event) => event.kind === KIND.userMessage));
    }

    findByTaskAndKind(userId: string, taskId: string, kind: EventKind): Promise<EventEntity[]> {
        return Promise.resolve(this.ordered(userId, taskId).filter((event) => event.kind === kind));
    }

    private ordered(userId: string, taskId: string): EventEntity[] {
        return this.rows.filter((event) => event.userId === userId && event.taskId === taskId).sort((a, b) => a.seq.localeCompare(b.seq));
    }
}
