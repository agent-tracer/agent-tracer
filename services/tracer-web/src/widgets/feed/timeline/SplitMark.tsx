import { Link } from "react-router-dom";
import { TaskId } from "~tracer-web/shared/identity.js";
import { useRevertTaskSplitMutation } from "~tracer-web/entities/task/api/split-mutations.js";
import { Hairline } from "~tracer-web/widgets/feed/timeline/Hairline.js";
import { DISABLED, GuidanceText } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

interface SplitMarkProps {
  readonly fromTurnIndex: number;
  readonly toTurnIndex: number;
  readonly taskId: string;
}

/** 옮겨 간 구간이 남긴 턴 번호의 구멍을 유실이 아니라 분리로 읽히게 하는 구분선이다. */
export function SplitMark({ fromTurnIndex, toTurnIndex, taskId }: SplitMarkProps) {
  const guidance = useGuidance();
  const revert = useRevertTaskSplitMutation();
  const accent = "var(--ink-tertiary)";

  return (
    <div
      className="group flex items-center gap-2.5 py-3 font-mono text-mini uppercase tracking-label"
      style={{ color: accent }}
    >
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
      <span className="normal-case tracking-normal">
        <GuidanceText
          locale={guidance.locale}
          message={guidance.messages.feed.splitMovedTurns(fromTurnIndex, toTurnIndex)}
        />
      </span>
      <Link
        to={`/tasks/${taskId}`}
        className="inline-flex items-center rounded-pill border border-hair px-2 py-[2px] normal-case tracking-normal text-ink-subtle transition-colors hover:text-ink hover:border-hair-strong"
      >
        open
      </Link>
      <button
        type="button"
        disabled={revert.isPending}
        onClick={() => revert.mutate(TaskId(taskId))}
        className={cn("inline-flex items-center rounded-pill border border-hair px-2 py-[2px] normal-case tracking-normal text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink hover:border-hair-strong focus-ring", DISABLED)}
      >
        undo
      </button>
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
    </div>
  );
}
