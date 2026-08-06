import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SessionDto } from "@agent-tracer/kernel";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import { useTurnSplit } from "~tracer-web/features/turn-split/model/use-turn-split.js";

function turn(index: number, sessionId = "s1"): TaskTurnSummary {
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
    askedText: `발화 ${index}`,
  };
}

const TURNS = [turn(1), turn(2), turn(3), turn(4)];
const ENDED = [{ id: "s1", status: "ended" }] as unknown as readonly SessionDto[];
const ACTIVE = [{ id: "s1", status: "active" }] as unknown as readonly SessionDto[];

describe("useTurnSplit", () => {
  it("같은 턴을 두 번 고르면 한 턴짜리 구간이 된다", () => {
    const { result } = renderHook(() => useTurnSplit(TURNS, ENDED));

    act(() => result.current.pick(3));
    act(() => result.current.pick(3));

    expect(result.current.target).toEqual({ sessionId: "s1", fromTurnIndex: 3, toTurnIndex: 3 });
  });

  it("두 턴을 고르면 그 사이가 구간이 된다", () => {
    const { result } = renderHook(() => useTurnSplit(TURNS, ENDED));

    act(() => result.current.pick(2));
    act(() => result.current.pick(4));

    expect(result.current.target).toEqual({ sessionId: "s1", fromTurnIndex: 2, toTurnIndex: 4 });
  });

  it("끝을 고른 뒤에는 시작 표시가 풀린다", () => {
    const { result } = renderHook(() => useTurnSplit(TURNS, ENDED));

    act(() => result.current.pick(2));
    act(() => result.current.pick(3));

    expect(result.current.startTurnIndex).toBeNull();
  });

  it("실행 중인 세션의 턴은 고르지 못한다", () => {
    const { result } = renderHook(() => useTurnSplit(TURNS, ACTIVE));

    expect(result.current.isSplittable(2)).toBe(false);
  });

  it("시작을 잡은 뒤에는 그 앞의 턴을 끝으로 고르지 못한다", () => {
    const { result } = renderHook(() => useTurnSplit(TURNS, ENDED));

    act(() => result.current.pick(3));

    expect(result.current.isSplittable(2)).toBe(false);
    expect(result.current.isSplittable(3)).toBe(true);
  });

  it("되돌리면 고르던 것이 모두 풀린다", () => {
    const { result } = renderHook(() => useTurnSplit(TURNS, ENDED));

    act(() => result.current.pick(2));
    act(() => result.current.reset());

    expect(result.current.startTurnIndex).toBeNull();
    expect(result.current.target).toBeNull();
  });
});
