import { useState, type MouseEvent } from "react";
import { expectationTool } from "@agent-tracer/kernel";
import type { RuleRecord } from "~tracer-web/entities/rule/model/rule.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import {
  useDeleteRuleMutation,
  useReEvaluateRuleMutation,
} from "~tracer-web/entities/rule/api/mutations.js";
import { useRuleEvidenceQuery } from "~tracer-web/entities/rule/api/queries.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { useConfirmAction } from "~tracer-web/shared/lib/hooks/use-confirm-action.js";
import { RuleSeverityChip } from "~tracer-web/widgets/rules/presentation/RuleSeverityChip.js";
import { RuleVerdictChip } from "~tracer-web/widgets/rules/presentation/RuleVerdictChip.js";
import { RuleEvidencePanel } from "~tracer-web/widgets/rules/evidence/RuleEvidencePanel.js";
import { RuleRowActions } from "~tracer-web/widgets/rules/inspector/RuleRowActions.js";

interface RuleRowProps {
  readonly rule: RuleRecord;
  /** 현재 태스크 컨텍스트. */
  readonly contextTaskId: TaskId | null;
  /** 이 규칙으로 채워진 규칙 편집 모달을 연다. */
  readonly onEdit: (rule: RuleRecord) => void;
}

/** Rules 탭에 나열되는 규칙 한 행. */
export function RuleRow({ rule, contextTaskId, onEdit }: RuleRowProps) {
  const reEvalMutation = useReEvaluateRuleMutation();
  const deleteMutation = useDeleteRuleMutation();
  const [expanded, setExpanded] = useState(false);
  const evidenceQ = useRuleEvidenceQuery(contextTaskId, rule.id, {
    enabled: expanded && contextTaskId !== null,
  });
  const matchCount = rule.matchCount ?? 0;
  // 미이행 규칙은 증거가 없어서 미이행이므로 개수로 막으면 이유를 볼 길이 사라진다.
  const canExpand =
    contextTaskId !== null && (matchCount > 0 || rule.verdictStatus !== null);

  const isPending = reEvalMutation.isPending || deleteMutation.isPending;

  const confirmDelete = useConfirmAction(() => deleteMutation.mutate(rule.id));

  const handleToggleExpand = () => {
    if (!canExpand) return;
    setExpanded((v) => !v);
  };

  const stopAnd = (fn: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={cn("group px-3 py-2.5 rounded-sm bg-s1 border border-hair", isPending && "opacity-50")}>
      <button
        type="button"
        onClick={handleToggleExpand}
        disabled={!canExpand}
        aria-expanded={canExpand ? expanded : undefined}
        aria-label={
          canExpand
            ? expanded
              ? "Collapse rule evidence"
              : "Expand rule evidence"
            : undefined
        }
        className={cn(
          "flex items-center gap-2 flex-wrap w-full text-left bg-transparent p-0",
          canExpand ? "cursor-pointer" : "cursor-default",
        )}
      >
        {canExpand && (
          <span
            aria-hidden
            className={cn(
              "inline-block font-mono text-micro text-ink-tertiary w-2.5 transition-transform duration-150 ease-in-out",
              expanded ? "rotate-90" : "rotate-0",
            )}
          >
            ▶
          </span>
        )}
        <RuleSeverityChip severity={rule.severity} />
        <span className="flex-1 min-w-0 truncate text-body font-medium text-ink tracking-snug">
          {rule.name}
        </span>
        <RuleVerdictChip status={rule.verdictStatus} />
      </button>

      <div className="flex items-center gap-2 flex-wrap mt-1.5 font-mono text-mini text-ink-tertiary">
        <span>source · {rule.source}</span>
        {expectationTool(rule.expect) && (
          <>
            <span className="text-hair-strong">·</span>
            <span>tool · {expectationTool(rule.expect)}</span>
          </>
        )}
      </div>

      {rule.rationale && (
        <p className="mt-2 m-0 text-meta text-ink-subtle leading-normal">
          {rule.rationale}
        </p>
      )}

      <RuleRowActions
        contextTaskId={contextTaskId}
        isPending={isPending}
        deleteFailed={deleteMutation.isError}
        deleteArmed={confirmDelete.armed}
        onReEval={stopAnd(() =>
          reEvalMutation.mutate({ ruleId: rule.id, taskId: rule.taskId }),
        )}
        onEdit={stopAnd(() => onEdit(rule))}
        onDelete={stopAnd(confirmDelete.trigger)}
      />

      {expanded && contextTaskId && (
        <RuleEvidencePanel
          isLoading={evidenceQ.isLoading}
          isError={evidenceQ.isError}
          status={evidenceQ.data?.status ?? null}
          anchored={Boolean(evidenceQ.data?.anchorEventId)}
          triggers={evidenceQ.data?.triggers ?? []}
          expects={evidenceQ.data?.expects ?? []}
        />
      )}
    </div>
  );
}
