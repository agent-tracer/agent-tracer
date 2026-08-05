import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import {
  useCancelRuleGenerationMutation,
  useDeleteRuleGenerationMutation,
} from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { formatRelativeShort } from "~tracer-web/shared/lib/formatting/time.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, Card, GuidanceText } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { GenerationOutcomeText } from "~tracer-web/widgets/rules/generation/GenerationOutcomeText.js";
import { readGenerationOutcome } from "~tracer-web/widgets/rules/generation/rule-generation-outcome.js";

const TONE_CLASS: Readonly<Record<string, string>> = {
  running: "text-ink",
  done: "text-ok",
  empty: "text-ink-muted",
  failed: "text-err",
  canceled: "text-ink-muted",
};

interface RuleGenerationStripProps {
  readonly record: RuleGenerationRecord;
  /** 이력 화면에서만 지우는 자리를 낸다. */
  readonly deletable?: boolean;
  readonly nowMs?: number;
}

/** 규칙 생성 실행 하나가 지금 어디까지 왔는지와 무엇을 남겼는지를 한 줄로 보인다. */
export function RuleGenerationStrip({ record, deletable = false, nowMs }: RuleGenerationStripProps) {
  const guidance = useGuidance();
  const cancel = useCancelRuleGenerationMutation();
  const remove = useDeleteRuleGenerationMutation();
  const outcome = readGenerationOutcome(record, guidance.messages.rules.generation);
  const active = record.status === "pending" || record.status === "running";

  return (
    <Card surface="canvas" className="py-3 px-4 flex items-center gap-3">
      <span
        className={cn("text-[12.5px] font-medium shrink-0", TONE_CLASS[outcome.tone] ?? "text-ink")}
        data-testid="generation-headline"
      >
        <GuidanceText locale={guidance.locale} message={outcome.headline} />
      </span>
      {outcome.detail !== null && (
        <GenerationOutcomeText
          locale={guidance.locale}
          value={outcome.detail}
          className="text-[12px] text-ink-subtle truncate"
        />
      )}
      {record.intent !== null && (
        <span className="text-[12px] text-ink-tertiary truncate">Intent: {record.intent}</span>
      )}
      <span className="ml-auto flex items-center gap-2 shrink-0">
        {nowMs !== undefined && (
          <span className="text-[11px] font-mono text-ink-tertiary">
            {formatRelativeShort(record.createdAt, nowMs)}
          </span>
        )}
        {record.createdRuleIds.length > 0 && (
          <span className="text-[11px] font-mono text-ink-tertiary">
            {record.createdRuleIds.length}
          </span>
        )}
        {active && (
          <Button
            variant="ghost"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(record.id)}
          >
            Stop
          </Button>
        )}
        {deletable && !active && (
          <Button
            variant="ghost"
            aria-label="Remove this run from the history"
            disabled={remove.isPending}
            onClick={() => remove.mutate(record.id)}
          >
            Remove
          </Button>
        )}
      </span>
    </Card>
  );
}
