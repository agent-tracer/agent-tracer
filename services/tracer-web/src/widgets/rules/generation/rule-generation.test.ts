import { describe, expect, it } from "vitest";
import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import {
  isSettledRuleGeneration,
  readRuleGenerationIntent,
} from "~tracer-web/widgets/rules/generation/rule-generation.js";

function record(overrides: Partial<RuleGenerationRecord> = {}): RuleGenerationRecord {
  return {
    id: "gen-1",
    taskId: "task-1" as TaskId,
    anchorEventId: "evt-1",
    intent: null,
    maxRules: null,
    status: "completed",
    observation: {
      model: null,
      costUsd: null,
      numTurns: null,
      durationMs: null,
      inputTokens: null,
      outputTokens: null,
      cacheReadTokens: null,
      cacheCreationTokens: null,
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

describe("isSettledRuleGeneration", () => {
  it("도는 중인 상태는 아직 종결이 아니다", () => {
    expect(isSettledRuleGeneration("pending")).toBe(false);
    expect(isSettledRuleGeneration("running")).toBe(false);
  });

  it("완료와 실패와 취소는 모두 종결이다", () => {
    expect(isSettledRuleGeneration("completed")).toBe(true);
    expect(isSettledRuleGeneration("failed")).toBe(true);
    expect(isSettledRuleGeneration("canceled")).toBe(true);
  });
});

describe("readRuleGenerationIntent", () => {
  it("지난 실행의 의도를 읽는다", () => {
    expect(readRuleGenerationIntent(record({ intent: "테스트를 먼저 쓴다" }))).toBe("테스트를 먼저 쓴다");
  });

  it("의도가 없거나 실행이 없으면 없는 것으로 본다", () => {
    expect(readRuleGenerationIntent(record())).toBeUndefined();
    expect(readRuleGenerationIntent(null)).toBeUndefined();
  });
});
