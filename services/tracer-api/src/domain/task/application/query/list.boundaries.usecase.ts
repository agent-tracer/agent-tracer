import { Inject, Injectable } from "@nestjs/common";
import { AGENT_TRACER_ATTR, KIND, type TurnBoundaryDto } from "@agent-tracer/kernel";
import { EVENT_READER, type EventReaderPort } from "~tracer-api/domain/task/port/event.reader.port.js";
import { TASK_REPOSITORY, type TaskRepositoryPort } from "~tracer-api/domain/task/port/task.repository.port.js";
import { TURN_READER, type TurnReaderPort } from "~tracer-api/domain/task/port/turn.reader.port.js";
import { pairBoundaries, type BoundaryMark } from "~tracer-api/domain/task/application/query/boundary.pairing.js";

export type { TurnBoundaryDto };

function boundaryLabel(metadata: Record<string, unknown>): string | undefined {
    const label = metadata[AGENT_TRACER_ATTR.boundaryLabel];
    return typeof label === "string" && label.trim() !== "" ? label : undefined;
}

/** 실행 중에 남긴 경계 마커를 사후 분리가 쓸 수 있는 턴 구간 제안으로 편다. */
@Injectable()
export class ListBoundariesUseCase {
    constructor(
        @Inject(TASK_REPOSITORY) private readonly tasks: TaskRepositoryPort,
        @Inject(TURN_READER) private readonly turns: TurnReaderPort,
        @Inject(EVENT_READER) private readonly events: EventReaderPort,
    ) {}

    async execute(
        userId: string,
        taskId: string,
    ): Promise<{ readonly items: readonly TurnBoundaryDto[] } | null> {
        const task = await this.tasks.findById(userId, taskId);
        // 남의 작업은 존재 여부도 드러내지 않는다.
        if (task === null) return null;

        const turns = await this.turns.findByTask(userId, taskId);
        const byId = new Map(turns.map((turn) => [turn.id, turn]));
        const marks: BoundaryMark[] = [];

        for (const event of await this.events.findByTaskAndKind(userId, taskId, KIND.boundaryLogged)) {
            if (event.turnId === null) continue;
            const turn = byId.get(event.turnId);
            if (turn === undefined) continue;
            marks.push({
                sessionId: turn.sessionId,
                turnIndex: turn.turnIndex,
                label: boundaryLabel(event.metadata) ?? event.title,
                back: event.metadata[AGENT_TRACER_ATTR.boundaryBack] === true,
                occurredAt: event.occurredAt.toISOString(),
            });
        }

        const lastIndexBySession = new Map<string, number>();
        for (const turn of turns) {
            const known = lastIndexBySession.get(turn.sessionId) ?? 0;
            if (turn.turnIndex > known) lastIndexBySession.set(turn.sessionId, turn.turnIndex);
        }

        return { items: pairBoundaries(marks, lastIndexBySession) };
    }
}
