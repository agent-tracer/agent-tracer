import { KIND } from "@agent-tracer/kernel";
import { describe, expect, it } from "vitest";
import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import { EventId, TaskId } from "~tracer-web/shared/identity.js";
import { extractLatestModel } from "~tracer-web/widgets/feed/lib/extraction/extract-model.js";

describe("extractLatestModel", () => {
  it("Codex token.usage metadata의 모델을 반환한다", () => {
    expect(extractLatestModel([event({ model: "gpt-5.6-sol" })])).toBe("gpt-5.6-sol");
  });
});

function event(metadata: Record<string, unknown>): TimelineEventRecord {
  return {
    id: EventId("event-1"),
    taskId: TaskId("task-1"),
    kind: KIND.tokenUsage,
    lane: "telemetry",
    title: "Token usage",
    metadata,
    classification: { lane: "telemetry", tags: [] },
    createdAt: "2026-07-10T00:00:00.000Z",
  };
}
