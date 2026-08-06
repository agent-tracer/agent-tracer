import { useMemo, useState } from "react";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { useMemosQuery } from "~tracer-web/entities/memo/api/queries.js";
import { useTasksQuery } from "~tracer-web/entities/task/api/list-queries.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import {
  GuidanceText,
  InlineState,
  PageHeader,
  loadFailedLabel,
  loadingLabel,
} from "~tracer-web/shared/ui/index.js";
import { MemoFilterBar, type AuthorFilter } from "~tracer-web/widgets/memos/MemoFilterBar.js";
import { MemoListItem } from "~tracer-web/widgets/memos/MemoListItem.js";

/** `/memos`. 워크스페이스 전체 메모 관리 화면이다. */
export function MemosPage() {
  const guidance = useGuidance();
  const { data, isLoading, isError } = useMemosQuery();
  const tasksQ = useTasksQuery();
  const taskById = useMemo(() => {
    const m = new Map<TaskId, MonitoringTask>();
    for (const t of tasksQ.data?.tasks ?? []) m.set(t.id, t);
    return m;
  }, [tasksQ.data]);
  const [author, setAuthor] = useState<AuthorFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.memos.filter((memo) => {
      if (author !== "all" && memo.author !== author) return false;
      if (q && !memo.body.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, author, search]);

  return (
    <div className="flex flex-col min-h-0 h-full overflow-auto">
      <PageHeader
        eyebrow="Workspace"
        title="Memos"
        intro={guidance.messages.memos.workspaceIntroduction}
        introLocale={guidance.locale}
        status={
          isLoading
            ? loadingLabel("memos")
            : data
              ? `${data.memos.length} memo${data.memos.length === 1 ? "" : "s"}`
              : loadFailedLabel("memos")
        }
      />
      <div className="px-9 pt-4 pb-2 border-b border-hair">
        <MemoFilterBar
          author={author}
          onAuthorChange={setAuthor}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      <div className="px-9 py-6 flex flex-col gap-2.5">
        {isError && (
          <div className="text-err text-body">
            <p className="m-0">{loadFailedLabel("memos")}</p>
            <GuidanceText
              as="p"
              className="mt-1 mb-0"
              locale={guidance.locale}
              message={guidance.messages.memos.loadError}
            />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          data && data.memos.length === 0 ? (
            <InlineState state="empty">
              <GuidanceText
                locale={guidance.locale}
                message={guidance.messages.memos.workspaceEmpty}
              />
            </InlineState>
          ) : (
            <InlineState state="empty">
              No memos match the current filters.
            </InlineState>
          )
        )}
        {filtered.map((memo) => (
          <MemoListItem key={memo.id} memo={memo} task={taskById.get(memo.taskId) ?? null} />
        ))}
      </div>
    </div>
  );
}
