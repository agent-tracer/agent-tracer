import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { TurnSplitTarget } from "~tracer-web/features/turn-split/model/turn-split-target.js";

const TITLE_MAX = 60;

/** 고른 구간에 실제로 든 턴이며 화면이 무엇을 옮기는지 보일 때 쓴다. */
export function turnsInSpan(
  turns: readonly TaskTurnSummary[],
  target: TurnSplitTarget,
): readonly TaskTurnSummary[] {
  return turns.filter(
    (turn) =>
      turn.sessionId === target.sessionId
      && turn.turnIndex >= target.fromTurnIndex
      && turn.turnIndex <= target.toTurnIndex,
  );
}

/** 한 턴이면 번호 하나, 여러 턴이면 범위로 적는다. */
export function splitSpanLabel(target: TurnSplitTarget): string {
  return target.fromTurnIndex === target.toTurnIndex
    ? String(target.fromTurnIndex)
    : `${target.fromTurnIndex}–${target.toTurnIndex}`;
}

/** 첫 턴의 발화를 제목 기본값으로 삼아 사람이 지우고 다시 쓰지 않게 한다. */
export function defaultSplitTitle(
  turns: readonly TaskTurnSummary[],
  target: TurnSplitTarget,
): string {
  const asked = turnsInSpan(turns, target).find((turn) => turn.askedText !== null)?.askedText;
  if (asked === undefined || asked === null) return "";
  const firstLine = asked.split("\n").find((line) => line.trim() !== "")?.trim() ?? "";
  return firstLine.length > TITLE_MAX ? `${firstLine.slice(0, TITLE_MAX).trimEnd()}…` : firstLine;
}
