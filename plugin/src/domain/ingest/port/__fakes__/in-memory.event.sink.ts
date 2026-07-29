import type {IngestEvent} from "~plugin/domain/ingest/model/ingest.event.model.js";
import type {EventSinkPort} from "~plugin/domain/ingest/port/event.sink.port.js";

export class InMemoryEventSink implements EventSinkPort {
    readonly events: IngestEvent[] = [];

    async append(events: readonly IngestEvent[]): Promise<void> {
        this.events.push(...events);
    }
}
