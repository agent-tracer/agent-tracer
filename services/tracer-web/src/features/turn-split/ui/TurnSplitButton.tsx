import type { TurnSplitSelection } from "~tracer-web/features/turn-split/model/turn-split-target.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
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

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          selection.pick(turnIndex);
        }}
        className={cn(
          "rounded-xs border border-hair px-1.5 py-px font-mono text-[10px] text-ink-muted",
          "hover:text-ink hover:bg-s2 transition-colors",
          picking && "border-primary text-ink",
          !picking && revealOnGroupHover && !awaitingEnd
            ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            : "opacity-100",
        )}
      >
        {picking ? "start" : awaitingEnd ? "end here" : "split"}
      </button>
      {picking ? (
        <span className="text-[10.5px] normal-case tracking-normal text-ink-tertiary">
          <GuidanceText locale={guidance.locale} message={guidance.messages.feed.splitPickEnd} />
        </span>
      ) : null}
    </span>
  );
}
