export const VERDICT_REALIGNER = Symbol("VerdictRealigner");

/** 분리로 턴의 소속이 바뀐 뒤 규칙 판정을 새 경계에 맞추는 포트다. */
export interface VerdictRealignerPort {
    /** 옮겨 간 턴을 가리키는 판정 중 그 규칙이 함께 가지 않은 것을 지우고 양쪽 태스크의 판정을 다시 계산한 뒤 지운 수를 반환한다. */
    realign(userId: string, movedTurnIds: readonly string[], taskIds: readonly string[]): Promise<number>;
}
