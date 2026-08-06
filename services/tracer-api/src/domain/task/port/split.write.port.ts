export const SPLIT_WRITER = Symbol("SplitWriter");

/** 투영도 같은 결과를 만들지만 다음 원장 배치까지 기다리지 않도록 분리가 조회 모델에 곧바로 반영하는 일괄 갱신이다. */
export interface SplitWriterPort {
    /** 옮겨 간 턴과 그 턴에 붙은 이벤트의 소속을 바꾸고 옮긴 턴 id를 반환한다. */
    moveTurns(
        userId: string,
        sessionId: string,
        fromTurnIndex: number,
        toTurnIndex: number,
        taskId: string,
    ): Promise<readonly string[]>;

    /** 그 턴에서 띄운 서브에이전트·백그라운드 자식 태스크를 함께 옮긴다. */
    moveChildTasks(userId: string, turnIds: readonly string[], taskId: string): Promise<number>;

    /** 그 턴을 anchor로 삼는 규칙과 레시피 적용 기록을 함께 옮긴다. */
    moveRuleAnchors(userId: string, turnIds: readonly string[], taskId: string): Promise<number>;

    /** 양쪽 태스크의 마지막 이벤트 시각을 다시 센다. */
    refreshTaskActivity(userId: string, taskIds: readonly string[]): Promise<void>;

    /** 턴을 모두 돌려주어 비게 된 분리 태스크를 지운다. */
    deleteTask(userId: string, taskId: string): Promise<void>;
}
