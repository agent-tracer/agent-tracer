import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { TurnSplitSelection } from "~tracer-web/features/turn-split/index.js";
import { TurnSplitButton } from "~tracer-web/features/turn-split/index.js";
import type { TimeRange } from "~tracer-web/widgets/feed/graph/model/time-range.js";
import { msToLeftPercent } from "~tracer-web/widgets/feed/graph/model/time-range.js";
import {
  TURN_STRIP_HEIGHT,
  trackLeftCss,
} from "~tracer-web/widgets/feed/graph/model/track-geometry.js";

interface TurnBandsProps {
  readonly turns: readonly TaskTurnSummary[];
  readonly range: TimeRange;
  readonly splitSelection?: TurnSplitSelection;
}

/** 그래프에도 턴 경계를 그어 어느 노드가 어느 턴에 속하는지 보이게 한다. */
export function TurnBands({ turns, range, splitSelection }: TurnBandsProps) {
  if (turns.length === 0) return null;

  return (
    <>
      {turns.map((turn) => {
        const leftPercent = msToLeftPercent(Date.parse(turn.startedAt), range);
        if (leftPercent < 0 || leftPercent > 100) return null;
        return (
          <div
            key={turn.id}
            className="group absolute top-0 bottom-0 z-[5] w-px bg-hair-strong"
            style={{ left: trackLeftCss(leftPercent) }}
          >
            <span
              className="absolute left-1 z-[13] flex items-center gap-1 whitespace-nowrap"
              style={{ top: (TURN_STRIP_HEIGHT - 16) / 2 }}
            >
              <span className="rounded-xs bg-s2 px-1 py-px font-mono text-nano tracking-eyebrow text-ink-tertiary">
                T{turn.turnIndex}
              </span>
              {splitSelection ? (
                <TurnSplitButton turnIndex={turn.turnIndex} selection={splitSelection} />
              ) : null}
            </span>
          </div>
        );
      })}
    </>
  );
}
