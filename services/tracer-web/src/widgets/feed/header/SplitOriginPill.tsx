import { Link, useNavigate } from "react-router-dom";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { useRevertTaskSplitMutation } from "~tracer-web/entities/task/api/split-mutations.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

interface SplitOriginPillProps {
  readonly taskId: TaskId;
  readonly originTaskId: TaskId;
}

/** 분리된 태스크가 원본과 세션을 공유한다는 사실을 설명하는 유일한 자리다. */
export function SplitOriginPill({ taskId, originTaskId }: SplitOriginPillProps) {
  const guidance = useGuidance();
  const navigate = useNavigate();
  const revert = useRevertTaskSplitMutation();

  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-ink-tertiary">
      <GuidanceText locale={guidance.locale} message={guidance.messages.feed.splitOrigin} />
      <Link to={`/tasks/${originTaskId}`} className="underline underline-offset-2">
        {originTaskId}
      </Link>
      <button
        type="button"
        disabled={revert.isPending}
        onClick={() => {
          revert.mutate(taskId, {
            onSuccess: () => {
              void navigate(`/tasks/${originTaskId}`);
            },
          });
        }}
        className="underline underline-offset-2 disabled:opacity-50"
      >
        undo split
      </button>
    </span>
  );
}
