import type { TurnReassignmentEntity } from "@agent-tracer/tracer-model";
import type { TurnReassignmentRepositoryPort } from "~tracer-api/domain/task/port/turn.reassignment.repository.port.js";

/** 턴 구간 재할당 포트의 인메모리 대역이다. */
export class InMemoryTurnReassignmentRepository implements TurnReassignmentRepositoryPort {
    private rows: TurnReassignmentEntity[] = [];

    seed(...rows: readonly TurnReassignmentEntity[]): void {
        this.rows.push(...rows);
    }

    all(): readonly TurnReassignmentEntity[] {
        return [...this.rows].sort((left, right) => left.fromTurnIndex - right.fromTurnIndex);
    }

    findBySession(userId: string, sessionId: string): Promise<TurnReassignmentEntity[]> {
        return Promise.resolve(this.rows.filter((row) => row.userId === userId && row.sessionId === sessionId));
    }

    findByTask(userId: string, taskId: string): Promise<TurnReassignmentEntity[]> {
        return Promise.resolve(this.rows.filter((row) => row.userId === userId && row.taskId === taskId));
    }

    findByOriginTask(userId: string, originTaskId: string): Promise<TurnReassignmentEntity[]> {
        return Promise.resolve(
            this.rows.filter((row) => row.userId === userId && row.originTaskId === originTaskId),
        );
    }

    upsertAll(rows: readonly TurnReassignmentEntity[]): Promise<void> {
        for (const row of rows) {
            const index = this.rows.findIndex((existing) => existing.id === row.id);
            if (index >= 0) this.rows[index] = row;
            else this.rows.push(row);
        }
        return Promise.resolve();
    }

    deleteByIds(ids: readonly string[]): Promise<void> {
        const removed = new Set(ids);
        this.rows = this.rows.filter((row) => !removed.has(row.id));
        return Promise.resolve();
    }
}
