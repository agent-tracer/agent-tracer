import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import type { GuidanceCatalog, GuidanceMessage } from "~tracer-web/shared/guidance.js";

type GenerationMessages = GuidanceCatalog["rules"]["generation"];

export interface RuleGenerationOutcomeLine {
  readonly tone: "running" | "done" | "empty" | "failed" | "canceled";
  readonly headline: GuidanceMessage;
  /** 서버가 준 사유와 잰 관측은 그대로 두고, 화면이 짓는 말만 목록에서 고른다. */
  readonly detail: GuidanceMessage | string | null;
}

function observationDetail(record: RuleGenerationRecord): string | null {
  const parts: string[] = [];
  const {model, costUsd, durationMs, numTurns} = record.observation;
  if (model !== null) parts.push(model);
  if (durationMs !== null) parts.push(`${Math.round(durationMs / 1000)}s`);
  if (numTurns !== null) parts.push(`${numTurns} turns`);
  if (costUsd !== null) parts.push(`$${costUsd.toFixed(3)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** 성공도 0건도 실패도 화면에서 서로 구분되게 한 줄로 만든다. */
export function readGenerationOutcome(
  record: RuleGenerationRecord,
  messages: GenerationMessages,
): RuleGenerationOutcomeLine {
  if (record.status === "pending") {
    return { tone: "running", headline: messages.waitingToStart, detail: null };
  }
  if (record.status === "running") {
    return { tone: "running", headline: messages.running, detail: null };
  }
  if (record.status === "canceled") {
    return { tone: "canceled", headline: messages.canceled, detail: observationDetail(record) };
  }
  if (record.status === "failed") {
    return {
      tone: "failed",
      headline: messages.failed,
      detail: record.error ?? observationDetail(record),
    };
  }
  const created = record.createdRuleIds.length;
  if (created === 0) {
    const skipped = record.skipped.length;
    return {
      tone: "empty",
      headline: messages.noneCreated,
      detail: skipped > 0
        ? messages.skippedWithoutEvidence(skipped)
        : messages.noObligationFound,
    };
  }
  return {
    tone: "done",
    headline: messages.created(created),
    detail: observationDetail(record),
  };
}
