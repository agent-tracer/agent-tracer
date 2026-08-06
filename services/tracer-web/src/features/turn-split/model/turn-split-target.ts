/** 고른 턴 구간이며 세션 안의 닫힌 범위다. */
export interface TurnSplitTarget {
  readonly sessionId: string;
  readonly fromTurnIndex: number;
  readonly toTurnIndex: number;
}

/** 턴 밴드와 그래프와 트레이스가 같은 두 번 클릭 흐름을 쓰도록 넘기는 선택 상태다. */
export interface TurnSplitSelection {
  readonly startTurnIndex: number | null;
  readonly isSplittable: (turnIndex: number) => boolean;
  readonly pick: (turnIndex: number) => void;
}
