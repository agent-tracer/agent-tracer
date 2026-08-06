import type { AxisTick } from "~tracer-web/widgets/feed/graph/model/axis-ticks.js";
import { AXIS_HEIGHT } from "~tracer-web/widgets/feed/graph/model/track-geometry.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface GraphAxisProps {
  readonly ticks: readonly AxisTick[];
  /** 그래프 왼쪽 레인 라벨 컬럼의 픽셀 너비. */
  readonly leftOffset: number;
}

/** 하단 시간 축. */
export function GraphAxis({ ticks, leftOffset }: GraphAxisProps) {
  return (
    <div
      className="relative border-t border-hair bg-canvas"
      style={{ height: AXIS_HEIGHT }}
    >
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{ left: leftOffset }}
      >
        {ticks.map((tick, idx) => (
          <span
            key={idx}
            className={cn(
              "absolute -translate-x-1/2 top-0 pt-2.5 font-mono text-mini whitespace-nowrap",
              tick.major ? "text-ink-muted font-medium" : "text-ink-tertiary font-normal",
            )}
            style={{ left: `${tick.leftPercent}%` }}
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-1/2 -translate-x-1/2 top-0 w-px",
                tick.major ? "h-2 bg-ink-subtle" : "h-[5px] bg-ink-tertiary",
              )}
            />
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}
