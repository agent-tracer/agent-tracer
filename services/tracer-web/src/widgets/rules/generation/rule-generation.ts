import { normalizeRuleGenerationIntent, isTerminalRuleGenerationStatus } from "@agent-tracer/kernel";
import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";

/** 더 이상 돌지 않는 실행이며 화면은 그때 결과를 읽는다. */
export function isSettledRuleGeneration(status: string): boolean {
  return isTerminalRuleGenerationStatus(status);
}

/** 지난 실행에 첨부됐던 의도다. */
export function readRuleGenerationIntent(record: RuleGenerationRecord | null): string | undefined {
  return normalizeRuleGenerationIntent(record?.intent);
}
