import type { TurnEntity } from "@agent-tracer/tracer-model";

export const TURN_READER = Symbol("TurnReader");

/** 태스크에 속한 턴 조회를 제공하는 애플리케이션 포트다. */
export interface TurnReaderPort {
    findByTask(taskId: string): Promise<TurnEntity[]>;
}
