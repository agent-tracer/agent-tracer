import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";

export interface RuleGenerationOutcomeLine {
  readonly tone: "running" | "done" | "empty" | "failed" | "canceled";
  readonly headline: string;
  readonly detail: string | null;
}

function observationDetail(record: RuleGenerationRecord): string | null {
  const parts: string[] = [];
  const {model, costUsd, durationMs, numTurns} = record.observation;
  if (model !== null) parts.push(model);
  if (durationMs !== null) parts.push(`${Math.round(durationMs / 1000)}초`);
  if (numTurns !== null) parts.push(`${numTurns}턴`);
  if (costUsd !== null) parts.push(`$${costUsd.toFixed(3)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** 성공도 0건도 실패도 화면에서 서로 구분되게 한 줄로 만든다. */
export function readGenerationOutcome(record: RuleGenerationRecord): RuleGenerationOutcomeLine {
  if (record.status === "pending") {
    return { tone: "running", headline: "규칙 생성을 기다리는 중", detail: null };
  }
  if (record.status === "running") {
    return { tone: "running", headline: "규칙을 뽑는 중", detail: null };
  }
  if (record.status === "canceled") {
    return { tone: "canceled", headline: "규칙 생성을 멈췄다", detail: observationDetail(record) };
  }
  if (record.status === "failed") {
    return {
      tone: "failed",
      headline: "규칙 생성이 실패했다",
      detail: record.error ?? observationDetail(record),
    };
  }
  const created = record.createdRuleIds.length;
  if (created === 0) {
    const skipped = record.skipped.length;
    return {
      tone: "empty",
      headline: "규칙을 만들지 않았다",
      detail: skipped > 0
        ? `근거가 서지 않아 ${skipped}건을 버렸다`
        : "이 요구에서 검증할 의무를 찾지 못했다",
    };
  }
  return {
    tone: "done",
    headline: `규칙 ${created}건을 만들었다`,
    detail: observationDetail(record),
  };
}
