import { describe, expect, it } from "vitest";
import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { readGenerationOutcome } from "~tracer-web/widgets/rules/generation/rule-generation-outcome.js";

function record(overrides: Partial<RuleGenerationRecord> = {}): RuleGenerationRecord {
  return {
    id: "gen-1",
    taskId: "task-1" as TaskId,
    anchorEventId: "evt-1",
    intent: null,
    maxRules: 2,
    status: "completed",
    observation: {
      model: "claude-sonnet-5",
      costUsd: 0.329,
      numTurns: 6,
      durationMs: 30172,
      inputTokens: 6,
      outputTokens: 2806,
      cacheReadTokens: 58019,
      cacheCreationTokens: 44796,
    },
    skipped: [],
    createdRuleIds: [],
    error: null,
    createdAt: "2026-08-05T03:00:00.000Z",
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe("readGenerationOutcome", () => {
  it("만든 규칙 수와 잰 관측을 함께 보인다", () => {
    const outcome = readGenerationOutcome(record({ createdRuleIds: ["r1", "r2"] }));

    expect(outcome.tone).toBe("done");
    expect(outcome.headline).toBe("규칙 2건을 만들었다");
    expect(outcome.detail).toBe("claude-sonnet-5 · 30초 · 6턴 · $0.329");
  });

  it("0건이면 왜 0건인지 말한다", () => {
    const outcome = readGenerationOutcome(record());

    expect(outcome.tone).toBe("empty");
    expect(outcome.detail).toContain("검증할 의무를 찾지 못했다");
  });

  it("근거가 서지 않아 버린 제안이 있으면 그것을 말한다", () => {
    const outcome = readGenerationOutcome(record({ skipped: ["citedTurnIds가 비었다"] }));

    expect(outcome.tone).toBe("empty");
    expect(outcome.detail).toContain("1건을 버렸다");
  });

  it("실패는 사유를 그대로 보인다", () => {
    const outcome = readGenerationOutcome(record({ status: "failed", error: "실행기가 죽었다" }));

    expect(outcome.tone).toBe("failed");
    expect(outcome.detail).toBe("실행기가 죽었다");
  });

  it("도는 중과 멈춘 것을 가른다", () => {
    expect(readGenerationOutcome(record({ status: "running" })).tone).toBe("running");
    expect(readGenerationOutcome(record({ status: "pending" })).tone).toBe("running");
    expect(readGenerationOutcome(record({ status: "canceled" })).tone).toBe("canceled");
  });
});
