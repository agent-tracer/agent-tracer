import { describe, expect, it } from "vitest";
import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { EN_GUIDANCE } from "~tracer-web/shared/guidance-en.js";
import { KO_GUIDANCE } from "~tracer-web/shared/guidance-ko.js";
import { isGuidanceMessage } from "~tracer-web/shared/guidance.js";
import { readGenerationOutcome } from "~tracer-web/widgets/rules/generation/rule-generation-outcome.js";

const en = EN_GUIDANCE.rules.generation;
const ko = KO_GUIDANCE.rules.generation;

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
    const outcome = readGenerationOutcome(record({ createdRuleIds: ["r1", "r2"] }), en);

    expect(outcome.tone).toBe("done");
    expect(isGuidanceMessage(outcome.headline)).toBe(true);
    expect(outcome.detail).toBe("claude-sonnet-5 · 30s · 6 turns · $0.329");
  });

  it("0건이면 왜 0건인지 말한다", () => {
    const outcome = readGenerationOutcome(record(), en);

    expect(outcome.tone).toBe("empty");
    expect(outcome.headline).toBe(en.noneCreated);
    expect(outcome.detail).toBe(en.noObligationFound);
  });

  it("근거가 서지 않아 버린 제안이 있으면 그것을 말한다", () => {
    const outcome = readGenerationOutcome(record({ skipped: ["citedTurnIds가 비었다"] }), en);

    expect(outcome.tone).toBe("empty");
    expect(outcome.detail).not.toBe(en.noObligationFound);
    expect(isGuidanceMessage(outcome.detail)).toBe(true);
  });

  it("실패는 서버가 준 사유를 그대로 보인다", () => {
    const outcome = readGenerationOutcome(
      record({ status: "failed", error: "실행기가 죽었다" }),
      en,
    );

    expect(outcome.tone).toBe("failed");
    expect(outcome.headline).toBe(en.failed);
    expect(outcome.detail).toBe("실행기가 죽었다");
  });

  it("도는 중과 멈춘 것을 가른다", () => {
    expect(readGenerationOutcome(record({ status: "running" }), en).tone).toBe("running");
    expect(readGenerationOutcome(record({ status: "pending" }), en).tone).toBe("running");
    expect(readGenerationOutcome(record({ status: "canceled" }), en).tone).toBe("canceled");
  });

  it("고른 언어의 목록에서 같은 자리를 고른다", () => {
    const outcome = readGenerationOutcome(record(), ko);

    expect(outcome.headline).toBe(ko.noneCreated);
    expect(outcome.headline).not.toBe(en.noneCreated);
  });

  it("잰 관측은 언어와 무관하게 같은 단위로 적는다", () => {
    const koOutcome = readGenerationOutcome(record({ createdRuleIds: ["r1"] }), ko);

    expect(koOutcome.detail).toBe("claude-sonnet-5 · 30s · 6 turns · $0.329");
  });
});
