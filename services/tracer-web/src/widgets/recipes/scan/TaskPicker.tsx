import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { formatRelativeShort } from "~tracer-web/shared/lib/formatting/time.js";
import { useNowMs } from "~tracer-web/shared/lib/hooks/use-now-ms.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import {
  AnchoredPopover,
  Chip,
  GuidanceText,
  InlineState,
  Input,
} from "~tracer-web/shared/ui/index.js";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { filterAnchorTasks } from "~tracer-web/widgets/recipes/scan/scan-anchor.js";

interface TaskPickerProps {
  readonly tasks: readonly MonitoringTask[];
  readonly loading: boolean;
  readonly selectedTaskId: TaskId | null;
  readonly onSelect: (taskId: TaskId) => void;
  readonly scannedTaskIds: ReadonlySet<string>;
  readonly includeArchived: boolean;
  readonly onIncludeArchivedChange: (include: boolean) => void;
  readonly disabled: boolean;
}

export function TaskPicker({
  tasks,
  loading,
  selectedTaskId,
  onSelect,
  scannedTaskIds,
  includeArchived,
  onIncludeArchivedChange,
  disabled,
}: TaskPickerProps) {
  const guidance = useGuidance();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const nowMs = useNowMs(15_000);
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => filterAnchorTasks(tasks, query), [tasks, query]);
  const selected = tasks.find((task) => task.id === selectedTaskId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full min-w-0 sm:w-auto">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex w-full min-w-0 items-center gap-2 px-2.5 py-1.5 sm:min-w-[280px] sm:max-w-[360px]",
          "text-lead text-left rounded-xs border border-hair bg-canvas",
          "focus-ring",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <span className={cn("flex-1 truncate", selected === null && "text-ink-tertiary")}>
          {selected === null ? "Select a completed task…" : (selected.displayTitle ?? selected.title)}
        </span>
        <span aria-hidden className="text-ink-tertiary text-mini">
          ▾
        </span>
      </button>

      {open && (
        <AnchoredPopover
          ref={popoverRef}
          anchorRef={anchorRef}
          role="dialog"
          aria-label="Completed tasks"
          preferredWidth={420}
          preferredMaxHeight={440}
          gap={4}
          className={cn(
            "rounded-xs",
            "border border-hair bg-canvas shadow-elev-1",
          )}
        >
          <div className="p-2 border-b border-hair">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks…"
              className="w-full"
            />
          </div>
          <div
            role="listbox"
            aria-label="Completed task options"
            className="max-h-[320px] overflow-y-auto py-1"
          >
            {loading && <InlineState state="loading" subject="tasks" dense />}
            {!loading && tasks.length === 0 && (
              <InlineState state="empty" dense>
                <GuidanceText
                  locale={guidance.locale}
                  message={guidance.messages.recipes.completedTasksEmpty}
                />
              </InlineState>
            )}
            {!loading && tasks.length > 0 && visible.length === 0 && (
              <InlineState state="empty" dense>
                <GuidanceText
                  locale={guidance.locale}
                  message={guidance.messages.recipes.taskSearchEmpty(query.trim())}
                />
              </InlineState>
            )}
            {visible.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                selected={task.id === selectedTaskId}
                scanned={scannedTaskIds.has(task.id)}
                nowMs={nowMs}
                onSelect={() => {
                  onSelect(task.id);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <label className="flex items-center gap-1.5 px-3 py-2 border-t border-hair text-meta text-ink-muted">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => onIncludeArchivedChange(e.target.checked)}
            />
            Include archived tasks
          </label>
        </AnchoredPopover>
      )}
    </div>
  );
}

function TaskRow({
  task,
  selected,
  scanned,
  nowMs,
  onSelect,
}: {
  readonly task: MonitoringTask;
  readonly selected: boolean;
  readonly scanned: boolean;
  readonly nowMs: number;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "w-full px-3 py-1.5 text-left hover:bg-s1",
        selected && "bg-s1",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="flex-1 truncate text-lead text-ink">
          {task.displayTitle ?? task.title}
        </span>
        {task.archived === true && <Chip tone="quiet">archived</Chip>}
        {scanned && <Chip tone="primary">scanned</Chip>}
      </div>
      <div className="mt-0.5 text-mini text-ink-tertiary">
        {formatRelativeShort(task.updatedAt, nowMs)}
      </div>
    </button>
  );
}


