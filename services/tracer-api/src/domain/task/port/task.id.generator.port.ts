export const TASK_ID_GENERATOR = Symbol("TaskIdGenerator");

/** 분리가 만드는 태스크와 구간 행의 식별자를 짓는 포트다. */
export interface TaskIdGeneratorPort {
    next(): string;
}
