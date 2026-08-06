import { describe, expect, it } from "vitest";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import {
  defaultSplitTitle,
  splitSpanLabel,
  turnsInSpan,
} from "~tracer-web/features/turn-split/model/split-preview.js";

function turn(index: number, askedText: string | null, sessionId = "s1"): TaskTurnSummary {
  return {
    id: `${sessionId}#${index}`,
    sessionId,
    taskId: "t1",
    turnIndex: index,
    status: "closed",
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: null,
    aggregateVerdict: null,
    rulesEvaluatedCount: 0,
    askedText,
  };
}

const TURNS = [
  turn(1, "로그인 화면을 고쳐줘"),
  turn(2, "오류 문구를 다듬어줘"),
  turn(3, "결제 영수증 PDF가 깨져"),
  turn(4, "영수증 여백을 맞춰줘"),
  turn(5, "다시 로그인으로"),
];

describe("turnsInSpan", () => {
  it("고른 구간에 든 턴만 준다", () => {
    const moved = turnsInSpan(TURNS, { sessionId: "s1", fromTurnIndex: 3, toTurnIndex: 4 });

    expect(moved.map((t) => t.turnIndex)).toEqual([3, 4]);
  });

  it("다른 세션의 턴은 섞이지 않는다", () => {
    const other = [...TURNS, turn(3, "남의 세션", "s2")];
    const moved = turnsInSpan(other, { sessionId: "s1", fromTurnIndex: 3, toTurnIndex: 3 });

    expect(moved).toHaveLength(1);
    expect(moved[0]?.sessionId).toBe("s1");
  });
});

describe("splitSpanLabel", () => {
  it("한 턴이면 번호 하나로 적는다", () => {
    expect(splitSpanLabel({ sessionId: "s1", fromTurnIndex: 3, toTurnIndex: 3 })).toBe("3");
  });

  it("여러 턴이면 범위로 적는다", () => {
    expect(splitSpanLabel({ sessionId: "s1", fromTurnIndex: 3, toTurnIndex: 5 })).toBe("3–5");
  });
});

describe("defaultSplitTitle", () => {
  // "Turn 7" 같은 값은 지우고 다시 쓰게 만들어 제목이 비어 있는 것과 같다.
  it("첫 턴의 발화를 제목 기본값으로 삼는다", () => {
    const title = defaultSplitTitle(TURNS, { sessionId: "s1", fromTurnIndex: 3, toTurnIndex: 4 });

    expect(title).toBe("결제 영수증 PDF가 깨져");
  });

  it("첫 줄만 쓰고 긴 발화는 줄인다", () => {
    const long = [turn(1, `${"가".repeat(80)}\n둘째 줄`)];
    const title = defaultSplitTitle(long, { sessionId: "s1", fromTurnIndex: 1, toTurnIndex: 1 });

    expect(title).toHaveLength(61);
    expect(title.endsWith("…")).toBe(true);
  });

  it("발화가 없으면 비운다", () => {
    expect(defaultSplitTitle([turn(1, null)], { sessionId: "s1", fromTurnIndex: 1, toTurnIndex: 1 })).toBe("");
  });
});
