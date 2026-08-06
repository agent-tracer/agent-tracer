import { useCallback, useMemo, useState } from "react";
import type { SessionDto } from "@agent-tracer/kernel";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { TurnSplitTarget } from "~tracer-web/widgets/feed/split/TurnSplitModal.js";

/** 첫 클릭이 시작 턴을 잡고 두 번째 클릭이 끝을 잡는 구간 선택 상태다. */
export interface TurnSplitState {
  readonly startTurnIndex: number | null;
  readonly target: TurnSplitTarget | null;
  readonly isSplittable: (turnIndex: number) => boolean;
  readonly pick: (turnIndex: number) => void;
  readonly reset: () => void;
}

function sessionOfTurn(
  turns: readonly TaskTurnSummary[],
  turnIndex: number,
): TaskTurnSummary | undefined {
  return turns.find((turn) => turn.turnIndex === turnIndex);
}

/** 세션이 끝나야 자를 수 있으므로 실행 중인 세션의 턴은 고르지 못한다. */
export function useTurnSplit(
  turns: readonly TaskTurnSummary[],
  sessions: readonly SessionDto[],
): TurnSplitState {
  const [startTurnIndex, setStartTurnIndex] = useState<number | null>(null);
  const [target, setTarget] = useState<TurnSplitTarget | null>(null);

  const endedSessionIds = useMemo(
    () => new Set(sessions.filter((session) => session.status === "ended").map((s) => s.id)),
    [sessions],
  );

  const isSplittable = useCallback(
    (turnIndex: number) => {
      const turn = sessionOfTurn(turns, turnIndex);
      if (turn === undefined) return false;
      if (!endedSessionIds.has(turn.sessionId)) return false;
      // 시작 턴을 잡은 뒤에는 같은 세션의 뒤쪽 턴만 끝이 될 수 있다.
      if (startTurnIndex === null) return true;
      const start = sessionOfTurn(turns, startTurnIndex);
      return start !== undefined && start.sessionId === turn.sessionId && turnIndex >= startTurnIndex;
    },
    [turns, endedSessionIds, startTurnIndex],
  );

  const pick = useCallback(
    (turnIndex: number) => {
      const turn = sessionOfTurn(turns, turnIndex);
      if (turn === undefined) return;
      if (startTurnIndex === null) {
        setStartTurnIndex(turnIndex);
        return;
      }
      setTarget({
        sessionId: turn.sessionId,
        fromTurnIndex: Math.min(startTurnIndex, turnIndex),
        toTurnIndex: Math.max(startTurnIndex, turnIndex),
      });
      setStartTurnIndex(null);
    },
    [turns, startTurnIndex],
  );

  const reset = useCallback(() => {
    setStartTurnIndex(null);
    setTarget(null);
  }, []);

  return { startTurnIndex, target, isSplittable, pick, reset };
}
