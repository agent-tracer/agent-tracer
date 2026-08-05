import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";
import { readGenerationOutcome } from "~tracer-web/widgets/rules/generation/rule-generation-outcome.js";
import type { RuleGenerationController } from "~tracer-web/widgets/rules/generation/useRuleGeneration.js";

interface RuleGenerationRunStatusProps {
  readonly controller: RuleGenerationController;
}

const TONE_CLASS: Readonly<Record<string, string>> = {
  running: "text-ink-tertiary",
  done: "text-ok",
  empty: "text-ink-tertiary",
  failed: "text-err",
  canceled: "text-ink-tertiary",
};

/** 규칙 생성의 실행 차단 사유와 마지막 실행의 결과를 표시한다. */
export function RuleGenerationRunStatus({ controller }: RuleGenerationRunStatusProps) {
  const guidance = useGuidance();
  const {
    errorMessage,
    incompleteTimelineStatus,
    isInFlight,
    lastIntent,
    operationalBlockingReason,
    record,
    stop,
  } = controller;
  const outcome = record === null ? null : readGenerationOutcome(record);

  return (
    <>
      {operationalBlockingReason && (
        <p className="mt-2 mb-0 text-[11px] text-ink-tertiary">
          {operationalBlockingReason}
        </p>
      )}
      {incompleteTimelineStatus && (
        <p className="mt-2 mb-0 text-[11px] text-warn">
          <span aria-hidden>⚠ </span>
          <GuidanceText
            locale={guidance.locale}
            message={guidance.messages.rules.generation.incompleteTimeline(incompleteTimelineStatus)}
          />
        </p>
      )}
      {outcome !== null && (
        <p className={cn("mt-2 mb-0 text-[11px]", TONE_CLASS[outcome.tone] ?? "text-ink-tertiary")}>
          {outcome.headline}
          {outcome.detail !== null && ` · ${outcome.detail}`}
          {isInFlight && (
            <button
              type="button"
              onClick={() => void stop()}
              className="ml-2 underline cursor-pointer bg-transparent border-0 p-0 text-[11px] text-ink-tertiary"
            >
              멈추기
            </button>
          )}
        </p>
      )}
      {lastIntent !== undefined && (
        <p className="mt-1 mb-0 text-[11px] text-ink-subtle break-words">
          Intent: “{lastIntent}”
        </p>
      )}
      {errorMessage && <p className="mt-2 mb-0 text-[11px] text-err">{errorMessage}</p>}
    </>
  );
}
