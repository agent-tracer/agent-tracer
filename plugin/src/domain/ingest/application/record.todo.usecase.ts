import {toIngestEvents} from "~plugin/domain/ingest/model/event.envelope.model.js";
import type {IngestTarget} from "~plugin/domain/ingest/model/event.model.js";
import type {ToolCall} from "~plugin/domain/ingest/model/tool.call.model.js";
import {shapeTodoEvents} from "~plugin/domain/ingest/model/todo.tool.model.js";
import type {ClockPort} from "~plugin/domain/ingest/port/clock.port.js";
import type {EventSinkPort} from "~plugin/domain/ingest/port/event.sink.port.js";
import type {IdGeneratorPort} from "~plugin/domain/ingest/port/id.generator.port.js";
import type {TodoSnapshotPort} from "~plugin/domain/ingest/port/todo.snapshot.port.js";
import {toRuntimeEvent} from "~plugin/domain/ingest/model/shaped.event.model.js";

/** 할 일 도구 호출을 직전 스냅샷과 대조해 전이 이벤트로 남긴다. */
export class RecordTodoUsecase {
    constructor(
        private readonly sink: EventSinkPort,
        private readonly snapshots: TodoSnapshotPort,
        private readonly ids: IdGeneratorPort,
        private readonly clock: ClockPort,
        private readonly runtimeSource: string,
    ) {}

    async execute(call: ToolCall, target: IngestTarget, runtimeSessionId: string): Promise<void> {
        const {events, snapshot} = shapeTodoEvents(call, this.snapshots.load(runtimeSessionId));
        if (events.length > 0) {
            await this.sink.append(toIngestEvents(
                events.map((shaped) => toRuntimeEvent(shaped, target)),
                this.runtimeSource,
                () => this.ids.next(),
                new Date(this.clock.now()).toISOString(),
            ));
        }
        if (snapshot !== null) this.snapshots.save(runtimeSessionId, snapshot);
    }
}
