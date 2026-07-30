import { Inject, Injectable } from "@nestjs/common";
import { EventPresentation, type TimelineItemDto } from "@agent-tracer/tracer-model";
import { TIMELINE_EVENT_READER, type TimelineEventReaderPort } from "~tracer-api/domain/timeline/port/event.reader.port.js";

export interface GetEventInput {
    readonly userId: string;
    readonly eventId: string;
}

@Injectable()
export class GetEventUseCase {
    constructor(
        @Inject(TIMELINE_EVENT_READER)
        private readonly events: TimelineEventReaderPort,
    ) {}

    async execute(input: GetEventInput): Promise<TimelineItemDto | null> {
        const event = await this.events.findById(input.userId, input.eventId);
        // 남의 이벤트는 존재 여부도 드러내지 않는다.
        if (event === null) return null;
        return new EventPresentation(event).toTimelineItem();
    }
}
