import type { TurnEntity } from "@agent-tracer/tracer-model";
import type { TurnReaderPort } from "~tracer-api/domain/task/port/turn.reader.port.js";

/** 턴 조회 포트의 인메모리 대역이다. */
export class InMemoryTurnReader implements TurnReaderPort {
    private readonly rows: TurnEntity[] = [];

    seed(...turns: readonly TurnEntity[]): void {
        this.rows.push(...turns);
    }

    all(): readonly TurnEntity[] {
        return [...this.rows];
    }

    findByTask(taskId: string): Promise<TurnEntity[]> {
        const rows = this.rows
            .filter((turn) => turn.taskId === taskId)
            .sort((a, b) => a.turnIndex - b.turnIndex);
        return Promise.resolve(rows);
    }
}
