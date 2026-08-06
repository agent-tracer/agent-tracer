import { Link } from "react-router-dom";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { StatusKind } from "~tracer-web/shared/ui/lib/status-kind.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import {
  Chip,
  GuidanceText,
  StatusDot,
  Tooltip,
} from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import {
  formatAbsoluteHHmmss,
  formatRelativeShort,
} from "~tracer-web/shared/lib/formatting/time.js";
import {
  TaskHierarchyGuides,
  TaskHierarchyToggle,
} from "~tracer-web/widgets/task-list/row/TaskHierarchyGuides.js";
import { TaskRowActions } from "~tracer-web/widgets/task-list/row/TaskRowActions.js";
import { TaskRowTags } from "~tracer-web/widgets/task-list/row/TaskRowTags.js";
import { useTaskRowActions } from "~tracer-web/widgets/task-list/row/useTaskRowActions.js";

interface TaskRowProps {
  readonly task: MonitoringTask;
  readonly unread: boolean;
  readonly depth: number;
  readonly hasChildren: boolean;
  readonly collapsed: boolean;
  readonly hideRuntimeBadge: boolean;
  readonly nowMs: number;
}

const STATUS_TO_DOT: Record<MonitoringTask["status"], StatusKind> = {
  running: "running",
  waiting: "waiting",
  completed: "done",
  errored: "failed",
};

/** 태스크 목록의 상태와 제목 및 계층 표시를 조립한다. */
export function TaskRow({
  task,
  unread,
  depth,
  hasChildren,
  collapsed,
  hideRuntimeBadge,
  nowMs,
}: TaskRowProps) {
  const guidance = useGuidance();
  const actions = useTaskRowActions(task);
  const status = STATUS_TO_DOT[task.status];
  const archived = Boolean(task.archived);
  const isSubagent = depth > 0;

  return (
    <Link
      to={`/tasks/${task.id}`}
      onMouseLeave={actions.disarmDelete}
      onBlur={actions.disarmDelete}
      className={cn(
        "group relative block py-2 mb-px rounded-sm border border-transparent",
        "hover:bg-s1",
        actions.active && "bg-s2 border-hair",
        actions.pending && "opacity-50 pointer-events-none",
      )}
      style={{ paddingLeft: 10 + depth * 20, paddingRight: 10 }}
    >
      {actions.active && (
        <span
          aria-hidden
          className="absolute -left-px top-2.5 bottom-2.5 w-[2px] rounded-sm bg-primary"
        />
      )}
      {!actions.active &&
        (task.status === "waiting" || task.status === "errored") && (
          <span
            aria-hidden
            className={cn(
              "absolute -left-px top-2.5 bottom-2.5 w-[2px] rounded-sm opacity-[0.85]",
              task.status === "errored" ? "bg-err" : "bg-warn",
            )}
          />
        )}
      <TaskHierarchyGuides depth={depth} />

      <div className="flex items-start gap-2">
        <TaskHierarchyToggle
          hasChildren={hasChildren}
          collapsed={collapsed}
          onToggle={actions.handleToggle}
        />
        <span className="flex h-5 shrink-0 items-center">
          <StatusDot
            status={status}
            pulse={task.status === "running"}
            tooltipContent={
              <GuidanceText
                locale={guidance.locale}
                message={guidance.messages.common.status[status]}
              />
            }
          />
        </span>
        {/* 제목과 그 아래 딸린 것들이 한 열에 서야 태그가 제목 왼쪽 끝에 맞는다. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 tracking-snug truncate",
                isSubagent ? "text-body italic" : "text-lead not-italic",
                unread
                  ? "font-semibold"
                  : isSubagent
                    ? "font-normal"
                    : "font-medium",
                isSubagent || task.status === "completed"
                  ? "text-ink-muted"
                  : "text-ink",
              )}
            >
              {task.displayTitle ?? task.title}
            </span>
            {task.status === "waiting" && <Chip tone="warn">wait</Chip>}
            <Tooltip
              content={
                unread && !actions.active
                  ? `New activity since you last opened this task · ${formatAbsoluteHHmmss(task.updatedAt)}`
                  : formatAbsoluteHHmmss(task.updatedAt)
              }
              side="left"
            >
              <span
                className={cn(
                  "font-mono text-mini",
                  unread && !actions.active
                    ? "text-primary font-semibold"
                    : "text-ink-subtle font-normal",
                )}
              >
                {formatRelativeShort(task.updatedAt, nowMs)}
              </span>
            </Tooltip>
            <TaskRowActions
              archived={archived}
              archivePending={actions.archivePending}
              archiveFailed={actions.archiveFailed}
              unarchiveFailed={actions.unarchiveFailed}
              deletePending={actions.deletePending}
              deleteFailed={actions.deleteFailed}
              deleteArmed={actions.deleteArmed}
              onArchive={actions.handleArchive}
              onUnarchive={actions.handleUnarchive}
              onDelete={actions.handleDelete}
            />
          </div>

          {!hideRuntimeBadge && task.runtimeSource && (
            <span className="inline-flex items-center gap-1 font-mono text-mini text-ink-tertiary">
              <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-primary" />
              {task.runtimeSource}
            </span>
          )}

          <TaskRowTags taskId={task.id} />
        </div>
      </div>
    </Link>
  );
}
