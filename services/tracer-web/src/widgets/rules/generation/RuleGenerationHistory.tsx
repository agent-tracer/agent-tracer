import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import { useClearRuleGenerationsMutation } from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { useNowMs } from "~tracer-web/shared/lib/hooks/use-now-ms.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, GuidanceText, InlineState } from "~tracer-web/shared/ui/index.js";
import { RuleGenerationStrip } from "~tracer-web/widgets/rules/generation/RuleGenerationStrip.js";

interface RuleGenerationHistoryProps {
  readonly records: readonly RuleGenerationRecord[];
  readonly isLoading: boolean;
}

function isActive(record: RuleGenerationRecord): boolean {
  return record.status === "pending" || record.status === "running";
}

/** 규칙 생성 실행이 무엇을 얼마에 남겼는지 모아 보이고 끝난 것을 지운다. */
export function RuleGenerationHistory({ records, isLoading }: RuleGenerationHistoryProps) {
  const guidance = useGuidance();
  const nowMs = useNowMs(15_000);
  const clear = useClearRuleGenerationsMutation();
  const running = records.filter(isActive).length;
  const finished = records.length - running;

  if (isLoading) {
    return <InlineState state="loading" subject="generation history" />;
  }

  if (records.length === 0) {
    return (
      <GuidanceText
        as="p"
        className="text-body text-ink-subtle text-center py-8"
        locale={guidance.locale}
        message={guidance.messages.rules.generation.historyEmpty}
      />
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 pb-1">
        <GuidanceText
          className="text-body text-ink-subtle"
          locale={guidance.locale}
          message={guidance.messages.rules.generation.runCount(records.length, running)}
        />
        <span className="ml-auto">
          <Button
            variant="ghost"
            disabled={finished === 0 || clear.isPending}
            onClick={() => clear.mutate()}
          >
            Clear finished
          </Button>
        </span>
      </div>
      {records.map((record) => (
        <RuleGenerationStrip key={record.id} record={record} deletable nowMs={nowMs} />
      ))}
    </>
  );
}
