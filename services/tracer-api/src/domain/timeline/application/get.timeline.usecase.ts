import { Inject, Injectable } from "@nestjs/common";
import { EventPresentation, type EventEntity, type TimelineItemDto } from "@agent-tracer/tracer-model";
import { TIMELINE_EVENT_READER, type TimelineEventReaderPort } from "~tracer-api/domain/timeline/port/event.reader.port.js";
import { TIMELINE_TASK_READER, type TimelineTaskReaderPort } from "~tracer-api/domain/timeline/port/task.reader.port.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/** 어느 끝에서부터 읽을지이며 이른 이벤트부터 읽으면 asc, 늦은 이벤트부터 읽으면 desc다. */
export type TimelineOrder = "asc" | "desc";

export interface GetTimelineInput {
    readonly userId: string;
    readonly taskId: string;
    /** 생략하면 읽기 방향의 첫 장을 반환하는 seq 커서다. */
    readonly cursor?: string;
    readonly limit?: number;
    readonly order?: TimelineOrder;
}

export interface GetTimelineResult {
    /** 읽기 방향과 무관하게 한 장 안에서는 늘 시간순이다. */
    readonly items: readonly TimelineItemDto[];
    /** 태스크의 이벤트 총 수이며 페이지 상한을 세지 않는다. */
    readonly total: number;
    /** 읽기 방향으로 더 읽을 것이 없으면 null인 다음 페이지 커서다. */
    readonly nextCursor: string | null;
}

@Injectable()
export class GetTimelineUseCase {
    constructor(
        @Inject(TIMELINE_TASK_READER)
        private readonly tasks: TimelineTaskReaderPort,
        @Inject(TIMELINE_EVENT_READER)
        private readonly events: TimelineEventReaderPort,
    ) {}

    async execute(input: GetTimelineInput): Promise<GetTimelineResult | null> {
        const task = await this.tasks.findById(input.userId, input.taskId);
        // 남의 작업은 존재 여부도 드러내지 않는다.
        if (task === null) return null;
        const limit = clampLimit(input.limit);
        const total = await this.events.countByTask(input.userId, input.taskId);
        const page = input.order === "asc"
            ? await this.readForward(input, limit)
            : [...(await this.events.findTimelineWindow(input.userId, input.taskId, input.cursor, limit))].reverse();
        const items = page.map((event) => new EventPresentation(event).toTimelineItem());
        // 다음 커서는 읽기 방향의 끝에 놓인 이벤트이며 asc는 가장 늦은 것, desc는 가장 이른 것이다.
        const edge = input.order === "asc" ? page.at(-1) : page.at(0);
        const nextCursor = page.length === limit && edge !== undefined ? edge.seq : null;
        return { items, total, nextCursor };
    }

    private async readForward(input: GetTimelineInput, limit: number): Promise<EventEntity[]> {
        const cursor = input.cursor !== undefined ? { seq: input.cursor } : undefined;
        return this.events.findTimeline(input.userId, input.taskId, cursor, limit);
    }
}

function clampLimit(raw: number | undefined): number {
    if (raw === undefined || !Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT;
    return Math.min(Math.floor(raw), MAX_LIMIT);
}
