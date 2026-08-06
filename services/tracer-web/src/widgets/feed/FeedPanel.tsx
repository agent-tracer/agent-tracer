import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { useLoadOlderTimelineMutation } from "~tracer-web/entities/task/api/timeline-mutations.js";
import {
  useTaskDetailQuery,
  useTaskVerificationsQuery,
} from "~tracer-web/entities/task/api/detail-queries.js";
import { useGuidance, useMainView } from "~tracer-web/shared/store/index.js";
import { isNotFoundError } from "~tracer-web/shared/api/client/response.js";
import { DISABLED, EmptyView, loadFailedTitle } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { TaskHeader } from "~tracer-web/widgets/feed/header/TaskHeader.js";
import { ActList } from "~tracer-web/widgets/feed/timeline/ActList.js";
import { buildFeed } from "~tracer-web/widgets/feed/lib/timeline/group-acts.js";
import { selectResumeTarget } from "~tracer-web/widgets/feed/lib/resume/resume-target.js";
import { useRevealSelectedLane } from "~tracer-web/widgets/feed/lib/use-reveal-selected-lane.js";
import { BoundarySuggestions } from "~tracer-web/widgets/feed/split/BoundarySuggestions.js";
import { TurnSplitModal, useTurnSplit } from "~tracer-web/features/turn-split/index.js";

// Feed는 기본 뷰라 즉시 렌더링한다.
const GraphView = lazy(() =>
  import("~tracer-web/widgets/feed/graph/GraphView.js").then((module) => ({ default: module.GraphView })),
);

interface FeedPanelProps {
  readonly taskId: TaskId;
}

/** `/tasks/:taskId`의 메인 패널이며 다음을 조합한다. */
export function FeedPanel({ taskId }: FeedPanelProps) {
  const guidance = useGuidance();
  const { data, isLoading, isError, error } = useTaskDetailQuery(taskId);
  const loadOlderTimeline = useLoadOlderTimelineMutation(taskId);
  const mainView = useMainView();
  // VERI 레인은 Graph에서만 렌더링하므로 Feed에서는 추가 왕복을 생략한다.
  const { data: verifications } = useTaskVerificationsQuery(taskId, {
    enabled: mainView === "graph",
  });

  const split = useTurnSplit(data?.turns ?? [], data?.sessions ?? []);
  useRevealSelectedLane(data?.timeline ?? []);

  const items = useMemo(() => {
    if (!data) return [];
    const baseMs = Date.parse(
      data.task.lastSessionStartedAt ?? data.task.createdAt,
    );
    return buildFeed(data.timeline, baseMs, data.turns, data.splits);
  }, [data]);

  if (isLoading) {
    return <EmptyView eyebrow="Loading" title="Task timeline" />;
  }
  if (isError || !data) {
    // 404/`not_found`는 태스크가 사라졌다는 뜻이다(다른 탭에서 삭제됐거나 URL의 id가 잘못됨).
    if (isNotFoundError(error)) {
      return (
        <EmptyView
          eyebrow="404"
          title="Task not found"
          description={guidance.messages.app.taskNotFound}
          locale={guidance.locale}
          action={
            <Link
              to="/tasks"
              className="inline-flex items-center px-3 py-1.5 rounded-xs border border-hair text-body text-ink bg-s1"
            >
              Back to tasks
            </Link>
          }
        />
      );
    }
    return (
      <EmptyView
        eyebrow="Error"
        title={loadFailedTitle("the task")}
        description={guidance.messages.app.taskServerUnavailable}
        locale={guidance.locale}
      />
    );
  }

  const resumeTarget = selectResumeTarget(data);

  return (
    <div className="flex flex-col min-h-0">
      <TaskHeader
        task={data.task}
        timeline={data.timeline}
        {...(resumeTarget ? { resumeTarget } : {})}
      />
      <BoundarySuggestions
        taskId={taskId}
        sessions={data.sessions ?? []}
        splitFromIndexes={new Set((data.splits ?? []).map((range) => range.fromTurnIndex))}
      />
      {data.olderCursor && (
        <div className="px-9 pb-2">
          <button
            type="button"
            onClick={() => loadOlderTimeline.mutate(data.olderCursor as string)}
            disabled={loadOlderTimeline.isPending}
            className={cn("inline-flex items-center px-3 py-1.5 rounded-xs border border-hair text-body text-ink-subtle bg-s1 focus-ring", DISABLED)}
          >
            {loadOlderTimeline.isPending ? "Loading older events…" : "Load older events"}
          </button>
        </div>
      )}
      {data.timeline.length === 0 ? (
        <div className="px-9">
          <EmptyView
            eyebrow="Empty"
            title="No events yet"
            description={guidance.messages.app.eventsPending}
            locale={guidance.locale}
          />
        </div>
      ) : mainView === "graph" ? (
        <Suspense fallback={null}>
          <GraphView
            events={data.timeline}
            verifications={verifications ?? []}
            {...(data.turns ? { turns: data.turns } : {})}
            taskStatus={data.task.status}
            splitSelection={split}
          />
        </Suspense>
      ) : (
        <div className="px-9">
          <ActList
            items={items}
            splitSelection={split}
          />
        </div>
      )}
      {split.target !== null && (
        <TurnSplitModal
          taskId={taskId}
          target={split.target}
          turns={data.turns ?? []}
          onClose={split.reset}
        />
      )}
    </div>
  );
}
