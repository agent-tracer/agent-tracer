import { AGENT_TRACER_ATTR, KIND } from "@agent-tracer/kernel";
import { describe, expect, it } from "vitest";
import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import { buildFeed } from "~tracer-web/widgets/feed/lib/timeline/group-acts.js";

const BASE = "2026-07-10T00:00:00.000Z";

function event(
  id: string,
  kind: TimelineEventRecord["kind"],
  createdAt: string,
  metadata: Record<string, unknown> = {},
): TimelineEventRecord {
  return {
    id: id as TimelineEventRecord["id"],
    taskId: "task-1" as TimelineEventRecord["taskId"],
    sessionId: "session-1" as NonNullable<TimelineEventRecord["sessionId"]>,
    turnId: "turn-1",
    kind,
    lane: "user",
    title: id,
    body: id,
    metadata,
    classification: { lane: "user", tags: [] },
    createdAt,
  };
}

describe("buildFeed", () => {
  it("늦게 수집한 중간 발화를 참조한 최종 응답 직전에 표시한다", () => {
    const response = event("response", KIND.assistantResponse, "2026-07-10T00:00:02.000Z");
    const commentary = event(
      "commentary",
      KIND.assistantCommentary,
      "2026-07-10T00:00:03.000Z",
      { [AGENT_TRACER_ATTR.turnResponseEventId]: response.id },
    );
    const turn: TaskTurnSummary = {
      id: "turn-1",
      taskId: "task-1",
      sessionId: "session-1",
      turnIndex: 1,
      status: "closed",
      startedAt: BASE,
      endedAt: "2026-07-10T00:00:02.001Z",
      aggregateVerdict: null,
      rulesEvaluatedCount: 0,
      askedText: null,
    };

    const feed = buildFeed([
      response,
      commentary,
      event("user", KIND.userMessage, BASE),
    ], Date.parse(BASE), [turn]);

    expect(feed.filter((item) => item.kind === "act").map((item) => item.vm.event.id))
      .toEqual(["user", "commentary", "response"]);
    expect(feed.filter((item) => item.kind === "turn-mark")).toHaveLength(1);
  });

  it("제때 수집한 중간 발화의 기존 시간 순서는 유지한다", () => {
    const response = event("response", KIND.assistantResponse, "2026-07-10T00:00:04.000Z");
    const commentary = event(
      "commentary",
      KIND.assistantCommentary,
      "2026-07-10T00:00:01.000Z",
      { [AGENT_TRACER_ATTR.turnResponseEventId]: response.id },
    );

    const feed = buildFeed([
      response,
      event("tool", KIND.executeTool, "2026-07-10T00:00:02.000Z"),
      commentary,
    ], Date.parse(BASE));

    expect(feed.filter((item) => item.kind === "act").map((item) => item.vm.event.id))
      .toEqual(["commentary", "tool", "response"]);
  });
});

describe("buildFeed 분리 마크", () => {
  function turnAt(index: number, id: string, startedAt: string): TaskTurnSummary {
    return {
      id,
      taskId: "task-1",
      sessionId: "session-1",
      turnIndex: index,
      status: "closed",
      startedAt,
      endedAt: null,
      aggregateVerdict: null,
      rulesEvaluatedCount: 0,
      askedText: null,
    };
  }

  function eventInTurn(id: string, turnId: string, createdAt: string): TimelineEventRecord {
    return { ...event(id, KIND.userMessage, createdAt), turnId };
  }

  // 구간이 통째로 빠져 턴 번호가 뛰므로, 설명이 없으면 이벤트가 유실된 것으로 읽힌다.
  it("옮겨 간 구간 자리에 분리 마크를 넣는다", () => {
    const turns = [
      turnAt(1, "t1", "2026-07-10T00:00:00.000Z"),
      turnAt(4, "t4", "2026-07-10T00:00:10.000Z"),
    ];
    const feed = buildFeed(
      [
        eventInTurn("a", "t1", "2026-07-10T00:00:00.000Z"),
        eventInTurn("b", "t4", "2026-07-10T00:00:10.000Z"),
      ],
      Date.parse(BASE),
      turns,
      [{ fromTurnIndex: 2, toTurnIndex: 3, taskId: "task-2", movedAt: BASE }],
    );

    const marks = feed.filter((item) => item.kind === "split-mark");
    expect(marks).toEqual([
      expect.objectContaining({ fromTurnIndex: 2, toTurnIndex: 3, taskId: "task-2" }),
    ]);
  });

  it("옮겨 간 구간이 없으면 마크를 넣지 않는다", () => {
    const turns = [turnAt(1, "t1", "2026-07-10T00:00:00.000Z")];
    const feed = buildFeed(
      [eventInTurn("a", "t1", "2026-07-10T00:00:00.000Z")],
      Date.parse(BASE),
      turns,
      [],
    );

    expect(feed.some((item) => item.kind === "split-mark")).toBe(false);
  });
});
