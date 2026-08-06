import { describe, expect, it } from "vitest";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { SpanTreeRow } from "~tracer-web/widgets/inspector/tabs/trace/lib/build-span-tree.js";
import { groupSpansByTurn } from "~tracer-web/widgets/inspector/tabs/trace/lib/group-spans-by-turn.js";

function turn(index: number, startedAt: string, endedAt: string | null): TaskTurnSummary {
  return {
    id: `s1#${index}`,
    sessionId: "s1",
    taskId: "t1",
    turnIndex: index,
    status: "closed",
    startedAt,
    endedAt,
    aggregateVerdict: null,
    rulesEvaluatedCount: 0,
    askedText: `발화 ${index}`,
  };
}

function span(id: string, startTime: string): SpanTreeRow {
  return {
    span: { spanId: id, startTime, name: id, kind: "LLM" } as SpanTreeRow["span"],
    depth: 0,
    hasChildren: false,
    elapsedMsFromRoot: null,
  };
}

const TURNS = [
  turn(1, "2026-01-01T00:00:00.000Z", "2026-01-01T00:01:00.000Z"),
  turn(2, "2026-01-01T00:02:00.000Z", "2026-01-01T00:03:00.000Z"),
];

describe("groupSpansByTurn", () => {
  it("턴이 바뀌는 자리에 머리글을 끼운다", () => {
    const rows = [
      span("a", "2026-01-01T00:00:10.000Z"),
      span("b", "2026-01-01T00:00:20.000Z"),
      span("c", "2026-01-01T00:02:10.000Z"),
    ];

    expect(groupSpansByTurn(rows, TURNS).map((e) => (e.kind === "turn" ? `T${e.turn.turnIndex}` : e.row.span.spanId)))
      .toEqual(["T1", "a", "b", "T2", "c"]);
  });

  it("턴이 없으면 span만 그대로 낸다", () => {
    const rows = [span("a", "2026-01-01T00:00:10.000Z")];

    expect(groupSpansByTurn(rows, []).every((e) => e.kind === "span")).toBe(true);
  });

  it("어느 턴의 창에도 들지 않는 span은 머리글을 만들지 않는다", () => {
    const rows = [span("a", "2025-01-01T00:00:00.000Z")];

    expect(groupSpansByTurn(rows, TURNS)).toEqual([{ kind: "span", row: rows[0] }]);
  });

  it("열린 턴은 시작 이후의 span을 모두 담는다", () => {
    const open = [turn(1, "2026-01-01T00:00:00.000Z", null)];
    const rows = [span("a", "2026-05-01T00:00:00.000Z")];

    expect(groupSpansByTurn(rows, open)[0]).toEqual({ kind: "turn", turn: open[0] });
  });
});
