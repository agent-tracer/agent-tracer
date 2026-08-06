import { Link, useNavigate } from "react-router-dom";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { useRevertTaskSplitMutation } from "~tracer-web/entities/task/api/split-mutations.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";
import { guidancePlainText } from "~tracer-web/shared/guidance-message.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

interface SplitOriginPillProps {
  readonly taskId: TaskId;
  readonly originTaskId: TaskId;
}

const PILL =
  "inline-flex items-center gap-1.5 rounded-pill border border-hair px-2 py-[2px] font-mono text-[10.5px] text-ink-subtle transition-colors hover:text-ink hover:border-hair-strong";

/** 분리된 태스크가 원본과 세션을 공유한다는 사실을 설명하는 유일한 자리다. */
export function SplitOriginPill({ taskId, originTaskId }: SplitOriginPillProps) {
  const guidance = useGuidance();
  const navigate = useNavigate();
  const revert = useRevertTaskSplitMutation();

  return (
    <span className="inline-flex items-center gap-2 text-[11.5px] text-ink-tertiary">
      <GuidanceText locale={guidance.locale} message={guidance.messages.feed.splitOrigin} />
      <Link to={`/tasks/${originTaskId}`} className={PILL}>
        <span className="text-ink-tertiary">origin</span>
        <span>{originTaskId.slice(-6)}</span>
      </Link>
      <button
        type="button"
        disabled={revert.isPending}
        title={guidancePlainText(guidance.messages.feed.revertSplit)}
        onClick={() => {
          revert.mutate(taskId, {
            onSuccess: () => {
              void navigate(`/tasks/${originTaskId}`);
            },
          });
        }}
        className={`${PILL} disabled:opacity-50`}
      >
        {revert.isPending ? "undoing…" : "undo split"}
      </button>
    </span>
  );
}
