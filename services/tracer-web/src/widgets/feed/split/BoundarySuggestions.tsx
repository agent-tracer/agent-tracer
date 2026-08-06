import type { SessionDto } from "@agent-tracer/kernel";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { TaskBoundarySuggestion } from "~tracer-web/entities/task/model/task-query.js";
import { useTaskBoundariesQuery } from "~tracer-web/entities/task/api/detail-queries.js";
import { useSplitTaskTurnsMutation } from "~tracer-web/entities/task/api/split-mutations.js";
import { Button } from "~tracer-web/shared/ui/index.js";

interface BoundarySuggestionsProps {
  readonly taskId: TaskId;
  readonly sessions: readonly SessionDto[];
  /** 이미 옮겨 간 구간의 시작 턴이며, 같은 제안을 두 번 보이지 않는다. */
  readonly splitFromIndexes: ReadonlySet<number>;
}

function spanLabel(suggestion: TaskBoundarySuggestion): string {
  return suggestion.fromTurnIndex === suggestion.toTurnIndex
    ? `Turn ${suggestion.fromTurnIndex}`
    : `Turns ${suggestion.fromTurnIndex}–${suggestion.toTurnIndex}`;
}

/** 실행 중에 남긴 경계 마커를 세션이 끝난 뒤 한 번의 분리로 바꿔 준다. */
export function BoundarySuggestions({
  taskId,
  sessions,
  splitFromIndexes,
}: BoundarySuggestionsProps) {
  const boundaries = useTaskBoundariesQuery(taskId);
  const mutation = useSplitTaskTurnsMutation(taskId);

  const endedSessionIds = new Set(
    sessions.filter((session) => session.status === "ended").map((session) => session.id),
  );
  // 살아 있는 세션은 자를 수 없으므로 그 세션의 제안은 아직 내지 않는다.
  const pending = (boundaries.data ?? []).filter(
    (item) => endedSessionIds.has(item.sessionId) && !splitFromIndexes.has(item.fromTurnIndex),
  );
  if (pending.length === 0) return null;

  return (
    <div className="mx-9 mb-3 rounded-sm border border-hair bg-s1 px-3 py-2.5">
      <p className="text-[10.5px] uppercase tracking-[0.06em] text-ink-tertiary">
        Work changed here
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {pending.map((item) => (
          <li
            key={`${item.sessionId}-${item.fromTurnIndex}`}
            className="flex items-center justify-between gap-3 text-[12.5px] text-ink"
          >
            <span>
              <span className="text-ink-tertiary">{spanLabel(item)}</span> {item.label}
            </span>
            <Button
              disabled={mutation.isPending}
              onClick={() => {
                mutation.mutate({
                  sessionId: item.sessionId,
                  fromTurnIndex: item.fromTurnIndex,
                  toTurnIndex: item.toTurnIndex,
                  newTitle: item.label,
                });
              }}
            >
              Split
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
