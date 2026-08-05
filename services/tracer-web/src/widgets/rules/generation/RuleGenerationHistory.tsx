import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import { useClearRuleGenerationsMutation } from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { useNowMs } from "~tracer-web/shared/lib/hooks/use-now-ms.js";
import { Button } from "~tracer-web/shared/ui/index.js";
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
  const nowMs = useNowMs(15_000);
  const clear = useClearRuleGenerationsMutation();
  const running = records.filter(isActive).length;
  const finished = records.length - running;

  if (isLoading) {
    return <p className="text-[12.5px] text-ink-subtle text-center py-8">Loading…</p>;
  }

  if (records.length === 0) {
    return (
      <p className="text-[12.5px] text-ink-subtle text-center py-8">
        아직 규칙 생성을 실행한 적이 없습니다. 위의 Generate rules로 시작하세요.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 pb-1">
        <span className="text-[12px] text-ink-subtle">
          {records.length}건
          {running > 0 && ` · 실행 중 ${running}건`}
        </span>
        <span className="ml-auto">
          <Button
            variant="ghost"
            disabled={finished === 0 || clear.isPending}
            onClick={() => clear.mutate()}
          >
            끝난 이력 비우기
          </Button>
        </span>
      </div>
      {records.map((record) => (
        <RuleGenerationStrip key={record.id} record={record} deletable nowMs={nowMs} />
      ))}
    </>
  );
}
