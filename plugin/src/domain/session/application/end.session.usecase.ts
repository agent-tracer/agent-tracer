import {toRunIngestEvent} from "~plugin/domain/ingest/model/ingest.event.model.js";
import type {EventSinkPort} from "~plugin/domain/ingest/port/event.sink.port.js";
import type {IdGeneratorPort} from "~plugin/domain/ingest/port/id.generator.port.js";
import type {ClockPort} from "~plugin/domain/session/port/clock.port.js";
import {sessionEndedEvent, type SessionEndInput} from "~plugin/domain/session/model/session.event.model.js";

/** 세션 종료를 원장에 알리고 필요하면 태스크까지 완료로 넘긴다. */
export class EndSessionUsecase {
    constructor(
        private readonly sink: EventSinkPort,
        private readonly ids: IdGeneratorPort,
        private readonly clock: ClockPort,
    ) {}

    async execute(input: SessionEndInput): Promise<void> {
        await this.sink.append([toRunIngestEvent(
            sessionEndedEvent(input),
            new Date(this.clock.now()).toISOString(),
            () => this.ids.next(),
        )]);
    }
}
