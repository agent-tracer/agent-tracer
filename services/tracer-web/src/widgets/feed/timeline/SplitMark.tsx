import { Link } from "react-router-dom";
import { Hairline } from "~tracer-web/widgets/feed/timeline/Hairline.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

interface SplitMarkProps {
  readonly fromTurnIndex: number;
  readonly toTurnIndex: number;
  readonly taskId: string;
}

/** 옮겨 간 구간이 남긴 턴 번호의 구멍을 유실이 아니라 분리로 읽히게 하는 구분선이다. */
export function SplitMark({ fromTurnIndex, toTurnIndex, taskId }: SplitMarkProps) {
  const guidance = useGuidance();
  const accent = "var(--ink-tertiary)";

  return (
    <div
      className="flex items-center gap-2.5 py-3 font-mono text-[10.5px] uppercase tracking-[0.04em]"
      style={{ color: accent }}
    >
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
      <span>
        —{" "}
        <GuidanceText
          locale={guidance.locale}
          message={guidance.messages.feed.splitMovedTurns(fromTurnIndex, toTurnIndex)}
        />
      </span>
      <Link to={`/tasks/${taskId}`} className="underline underline-offset-2 hover:opacity-80">
        open
      </Link>
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
    </div>
  );
}
