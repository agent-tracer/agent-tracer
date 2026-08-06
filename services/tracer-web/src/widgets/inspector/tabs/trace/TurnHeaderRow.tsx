import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { TurnSplitSelection } from "~tracer-web/features/turn-split/index.js";
import { TurnSplitButton } from "~tracer-web/features/turn-split/index.js";

interface TurnHeaderRowProps {
  readonly turn: TaskTurnSummary;
  readonly splitSelection?: TurnSplitSelection;
}

/** 트레이스에서 span 묶음이 어느 턴의 것인지 알리고 그 자리에서 분리를 시작하게 한다. */
export function TurnHeaderRow({ turn, splitSelection }: TurnHeaderRowProps) {
  return (
    <div className="group flex items-center gap-2 px-2 pt-3 pb-1">
      <span className="shrink-0 font-mono text-mini uppercase tracking-eyebrow text-ink-tertiary">
        Turn {turn.turnIndex}
      </span>
      <span className="min-w-0 flex-1 truncate text-meta text-ink-muted">
        {turn.askedText ?? ""}
      </span>
      {splitSelection ? (
        <TurnSplitButton turnIndex={turn.turnIndex} selection={splitSelection} />
      ) : null}
    </div>
  );
}
