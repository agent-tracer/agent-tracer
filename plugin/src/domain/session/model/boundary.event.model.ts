import {AGENT_TRACER_ATTR} from "@agent-tracer/kernel/observability/semconv.const.js";
import {KIND, LANE} from "~plugin/domain/ingest/model/event.model.js";
import type {IngestTarget} from "~plugin/domain/ingest/model/event.model.js";
import type {RunEventInput} from "~plugin/domain/ingest/model/ingest.event.model.js";

const LABEL_MAX = 120;

/** 작업이 바뀌거나 되돌아오는 자리를 그 순간에만 알 수 있는 정보로 표시한 것이다. */
export interface BoundaryInput {
    readonly label: string;
    readonly back: boolean;
}

export function boundaryLoggedEvent(target: IngestTarget, input: BoundaryInput): RunEventInput {
    const label = input.label.trim().slice(0, LABEL_MAX);
    return {
        kind: KIND.boundaryLogged,
        taskId: target.taskId,
        sessionId: target.sessionId,
        ...(target.turnId ? {turnId: target.turnId} : {}),
        payload: {
            lane: LANE.planning,
            title: input.back ? `↩ ${label}` : `⇥ ${label}`,
            metadata: {
                [AGENT_TRACER_ATTR.boundaryLabel]: label,
                [AGENT_TRACER_ATTR.boundaryBack]: input.back,
            },
        },
    };
}
