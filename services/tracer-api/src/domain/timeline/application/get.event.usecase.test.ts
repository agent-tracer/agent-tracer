import { describe, expect, it } from "vitest";
import { KIND } from "@agent-tracer/kernel";
import { EventEntity } from "@agent-tracer/tracer-model";
import { InMemoryTimelineEventReader } from "~tracer-api/domain/timeline/port/__fakes__/in-memory.event.reader.js";
import { GetEventUseCase } from "./get.event.usecase.js";

function makeEvent(id: string, userId: string): EventEntity {
    const event = new EventEntity();
    event.id = id;
    event.seq = "1";
    event.userId = userId;
    event.taskId = "t1";
    event.sessionId = null;
    event.turnId = null;
    event.kind = KIND.userMessage;
    event.lane = "user";
    event.title = id;
    event.body = null;
    event.toolName = null;
    event.filePaths = [];
    event.metadata = {};
    event.traceId = "trace-1";
    event.spanId = id;
    event.parentSpanId = null;
    event.occurredAt = new Date("2026-01-01T00:00:00.000Z");
    return event;
}

function makeUseCase(events: EventEntity[]): GetEventUseCase {
    const reader = new InMemoryTimelineEventReader();
    reader.seed(...events);
    return new GetEventUseCase(reader);
}

describe("GetEventUseCase", () => {
    it("이 사용자의 이벤트를 종류와 태스크와 함께 낸다", async () => {
        const useCase = makeUseCase([makeEvent("e1", "u1")]);

        const event = await useCase.execute({ userId: "u1", eventId: "e1" });

        expect(event).toMatchObject({ id: "e1", taskId: "t1", kind: KIND.userMessage });
    });

    it("남의 이벤트는 존재를 드러내지 않는다", async () => {
        const useCase = makeUseCase([makeEvent("e1", "u2")]);

        expect(await useCase.execute({ userId: "u1", eventId: "e1" })).toBeNull();
    });

    it("없는 이벤트를 비운다", async () => {
        const useCase = makeUseCase([]);

        expect(await useCase.execute({ userId: "u1", eventId: "없다" })).toBeNull();
    });
});
