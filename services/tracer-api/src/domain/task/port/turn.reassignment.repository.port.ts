import type { TurnReassignmentEntity } from "@agent-tracer/tracer-model";

export const TURN_REASSIGNMENT_REPOSITORY = Symbol("TurnReassignmentRepository");

/** 턴 구간 재할당을 읽고 쓰는 애플리케이션 포트다. */
export interface TurnReassignmentRepositoryPort {
    findBySession(userId: string, sessionId: string): Promise<TurnReassignmentEntity[]>;
    findByTask(userId: string, taskId: string): Promise<TurnReassignmentEntity[]>;
    findByOriginTask(userId: string, originTaskId: string): Promise<TurnReassignmentEntity[]>;
    upsertAll(rows: readonly TurnReassignmentEntity[]): Promise<void>;
    deleteByIds(ids: readonly string[]): Promise<void>;
}
