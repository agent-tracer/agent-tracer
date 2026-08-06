import {
  ArchiveIcon,
  IconButton,
  Tooltip,
  TrashIcon,
  UnarchiveIcon,
} from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import type { TaskRowActionHandler } from "~tracer-web/widgets/task-list/row/useTaskRowActions.js";

interface TaskRowActionsProps {
  readonly archived: boolean;
  readonly archivePending: boolean;
  readonly archiveFailed: boolean;
  readonly unarchiveFailed: boolean;
  readonly deletePending: boolean;
  readonly deleteFailed: boolean;
  readonly deleteArmed: boolean;
  readonly onArchive: TaskRowActionHandler;
  readonly onUnarchive: TaskRowActionHandler;
  readonly onDelete: TaskRowActionHandler;
}

/** 태스크 보관과 복원 및 숨기기 컨트롤을 표시한다. */
export function TaskRowActions({
  archived,
  archivePending,
  archiveFailed,
  unarchiveFailed,
  deletePending,
  deleteFailed,
  deleteArmed,
  onArchive,
  onUnarchive,
  onDelete,
}: TaskRowActionsProps) {
  const lifecycleFailed = archiveFailed || unarchiveFailed;
  // 알릴 것이 있는 동안에만 자리를 차지하고, 그 밖에는 좁은 사이드바의 폭을 제목에 준다.
  const pinned =
    lifecycleFailed || archivePending || deleteArmed || deleteFailed || deletePending;

  return (
    <span
      className={cn(
        "shrink-0 items-center gap-1",
        pinned ? "flex" : "hidden group-hover:flex group-focus-within:flex",
      )}
    >
      <Tooltip
        content={
          archived
            ? unarchiveFailed
              ? "Unarchive failed — try again"
              : "Unarchive task"
            : archiveFailed
              ? "Archive failed — try again"
              : "Archive task"
        }
        side="left"
      >
        <IconButton
          onClick={archived ? onUnarchive : onArchive}
          aria-label={archived ? "Unarchive task" : "Archive task"}
          tone={lifecycleFailed ? "danger" : "neutral"}
        >
          {archived ? <UnarchiveIcon /> : <ArchiveIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip
        content={
          deleteArmed
            ? "Click again to confirm"
            : deleteFailed
              ? "Hide failed — try again"
              : "Hide task"
        }
        side="left"
      >
        <IconButton
          onClick={onDelete}
          aria-label={deleteArmed ? "Confirm hide" : "Hide task"}
          tone={deleteFailed || deleteArmed ? "danger" : "neutral"}
          armed={deleteArmed}
        >
          <TrashIcon />
        </IconButton>
      </Tooltip>
    </span>
  );
}
