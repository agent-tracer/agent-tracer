import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import { useCancelRuleGenerationMutation } from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { Button, Card } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { readGenerationOutcome } from "~tracer-web/widgets/rules/generation/rule-generation-outcome.js";

const TONE_CLASS: Readonly<Record<string, string>> = {
  running: "text-ink",
  done: "text-ok",
  empty: "text-ink-muted",
  failed: "text-err",
  canceled: "text-ink-muted",
};

/** 규칙 생성 실행 하나가 지금 어디까지 왔는지와 무엇을 남겼는지를 한 줄로 보인다. */
export function RuleGenerationStrip({ record }: { readonly record: RuleGenerationRecord }) {
  const cancel = useCancelRuleGenerationMutation();
  const outcome = readGenerationOutcome(record);
  const active = record.status === "pending" || record.status === "running";

  return (
    <Card surface="canvas" className="py-3 px-4 flex items-center gap-3">
      <span
        className={cn("text-[12.5px] font-medium", TONE_CLASS[outcome.tone] ?? "text-ink")}
        data-testid="generation-headline"
      >
        {outcome.headline}
      </span>
      {outcome.detail !== null && (
        <span className="text-[12px] text-ink-subtle truncate">{outcome.detail}</span>
      )}
      {record.intent !== null && (
        <span className="text-[12px] text-ink-tertiary truncate">의도: {record.intent}</span>
      )}
      <span className="ml-auto flex items-center gap-2">
        {record.createdRuleIds.length > 0 && (
          <span className="text-[11px] font-mono text-ink-tertiary">
            {record.createdRuleIds.length}건
          </span>
        )}
        {active && (
          <Button
            variant="ghost"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(record.id)}
          >
            멈추기
          </Button>
        )}
      </span>
    </Card>
  );
}
