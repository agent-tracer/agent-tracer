import type { TurnSplitSelection } from "~tracer-web/features/turn-split/model/turn-split-target.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { guidancePlainText } from "~tracer-web/shared/guidance-message.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface TurnSplitButtonProps {
  readonly turnIndex: number;
  readonly selection: TurnSplitSelection;
  /** 평소에는 숨었다가 감싼 행에 마우스가 올 때만 보이게 한다. */
  readonly revealOnGroupHover?: boolean;
}

/** 턴 밴드와 그래프와 트레이스가 같은 두 번 클릭으로 구간을 고르게 하는 단추다. */
export function TurnSplitButton({
  turnIndex,
  selection,
  revealOnGroupHover = true,
}: TurnSplitButtonProps) {
  const guidance = useGuidance();
  if (!selection.isSplittable(turnIndex)) return null;

  const picking = selection.startTurnIndex === turnIndex;
  const awaitingEnd = selection.startTurnIndex !== null;
  // 고른 턴을 다시 누르면 그 턴 하나만 떨어지므로 단추가 그 사실을 말한다.
  const label = picking ? "only this" : awaitingEnd ? "end here" : "split";

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        title={guidancePlainText(
          picking ? guidance.messages.feed.splitOnlyThis : guidance.messages.feed.splitTurnsAction,
        )}
        onClick={(event) => {
          event.stopPropagation();
          selection.pick(turnIndex);
        }}
        className={cn(
          "inline-flex h-6 items-center rounded-pill border px-2 font-mono text-mini normal-case tracking-normal transition-colors focus-ring",
          picking
            ? "border-primary text-ink"
            : "border-hair text-ink-subtle hover:text-ink hover:border-hair-strong",
          !picking && revealOnGroupHover && !awaitingEnd
            ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            : "opacity-100",
        )}
      >
        {label}
      </button>
    </span>
  );
}
