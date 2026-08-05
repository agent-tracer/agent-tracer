import { Fragment } from "react";
import type { GuidanceLocale, GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { GuidanceText, ScrollArea } from "~tracer-web/shared/ui/index.js";
import { useGuidance, useSidebarSearchQuery } from "~tracer-web/shared/store/index.js";
import { useDebouncedValue } from "~tracer-web/shared/lib/hooks/use-debounced-value.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { TaskListHeader } from "~tracer-web/widgets/task-list/TaskListHeader.js";
import { TaskListFilters } from "~tracer-web/widgets/task-list/TaskListFilters.js";
import { TaskListTagFilter } from "~tracer-web/widgets/task-list/TaskListTagFilter.js";
import { TaskGroupHeader } from "~tracer-web/widgets/task-list/TaskGroup.js";
import { TaskRow } from "~tracer-web/widgets/task-list/row/TaskRow.js";
import { TaskListFooter } from "~tracer-web/widgets/task-list/TaskListFooter.js";
import { SearchResultsPanel } from "~tracer-web/widgets/task-list/search/SearchResultsPanel.js";
import { SidebarViewSwitcher } from "~tracer-web/widgets/task-list/SidebarViewSwitcher.js";
import { useTaskList } from "~tracer-web/widgets/task-list/hooks/useTaskList.js";

/** `/tasks/*` 라우트의 사이드바 루트. */
export function TaskListPanel() {
  const guidance = useGuidance();
  const {
    groups,
    counts,
    nowMs,
    subagentCount,
    isLoading,
    isError,
    hasMore,
    isFetchingMore,
    fetchMore,
    uniformRuntime,
  } = useTaskList();
  const sharedRuntime = uniformRuntime;
  const rawQuery = useSidebarSearchQuery();
  const query = useDebouncedValue(rawQuery, 250);
  const isSearching = query.trim().length > 0;

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="pt-2">
        <SidebarViewSwitcher
          {...(subagentCount !== undefined ? { subagentCount } : {})}
        />
        <TaskListHeader />
        {!isSearching && <TaskListFilters counts={counts} />}
        {!isSearching && <TaskListTagFilter />}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {isSearching ? (
          <SearchResultsPanel query={query} />
        ) : (
          <div className="px-2 pt-1.5 pb-3.5">
            {isLoading && <Status label="Loading tasks…" />}
            {isError && (
              <Status
                message={guidance.messages.tasks.listLoadError}
                locale={guidance.locale}
                tone="err"
              />
            )}
            {!isLoading && !isError && groups.length === 0 && (
              <Status
                message={guidance.messages.tasks.filterEmpty}
                locale={guidance.locale}
              />
            )}
            {groups.map((group) => (
              <Fragment key={group.key}>
                <TaskGroupHeader
                  label={group.label}
                  count={group.rows.length}
                />
                {group.rows.map((row) => (
                  <TaskRow
                    key={row.task.id}
                    task={row.task}
                    unread={row.unread}
                    depth={row.depth}
                    hasChildren={row.hasChildren}
                    collapsed={row.collapsed}
                    hideRuntimeBadge={uniformRuntime !== null}
                    nowMs={nowMs}
                  />
                ))}
              </Fragment>
            ))}
            {!isLoading && !isError && hasMore && (
              <button
                type="button"
                onClick={fetchMore}
                disabled={isFetchingMore}
                className={cn(
                  "mt-2 w-full rounded-sm border border-hair px-3 py-2 text-xs hover:bg-s1 disabled:opacity-60 text-ink-subtle",
                  isFetchingMore ? "cursor-wait" : "cursor-pointer",
                )}
              >
                {isFetchingMore ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        )}
      </ScrollArea>

      <TaskListFooter
        {...(sharedRuntime ? { runtimeCaption: sharedRuntime } : {})}
      />
    </div>
  );
}

function Status({
  label,
  message,
  locale,
  tone = "muted",
}: {
  /** 불러오는 중 같은 조작 표시는 영어 한 낱말로 남는다. */
  label?: string;
  message?: GuidanceMessage;
  locale?: GuidanceLocale;
  tone?: "muted" | "err";
}) {
  const className = cn(
    "px-3 py-4 text-center text-xs",
    tone === "err" ? "text-err" : "text-ink-subtle",
  );
  if (message !== undefined && locale !== undefined) {
    return <GuidanceText as="div" className={className} locale={locale} message={message} />;
  }
  return <div className={className}>{label}</div>;
}
