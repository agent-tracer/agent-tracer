import { isMemoHit } from "~tracer-web/features/search/model/search.js";
import { useSearchQuery } from "~tracer-web/features/search/api/queries.js";
import {
  useSelectedTaskId,
  useSetSidebarSearchScope,
  useSetSidebarSearchType,
  useSidebarSearchScope,
  useSidebarSearchType,
} from "~tracer-web/shared/store/index.js";
import { InlineState, SegmentedButton } from "~tracer-web/shared/ui/index.js";
import { useNowMs } from "~tracer-web/shared/lib/hooks/use-now-ms.js";
import {
  EventHitRow,
  MemoHitRow,
  TaskHitRow,
} from "~tracer-web/widgets/task-list/search/SearchResultRow.js";

interface SearchResultsPanelProps {
  /** 이미 디바운스된 검색어. */
  readonly query: string;
}

/** 검색이 활성화된 동안 그룹화된 태스크 목록을 대체한다. */
export function SearchResultsPanel({ query }: SearchResultsPanelProps) {
  const nowMs = useNowMs(15_000);
  const searchType = useSidebarSearchType();
  const setSearchType = useSetSidebarSearchType();
  const scope = useSidebarSearchScope();
  const setScope = useSetSidebarSearchScope();
  const selectedTaskId = useSelectedTaskId();
  const effectiveScopeIsTask = scope === "this-task" && selectedTaskId !== null;

  const { data, isLoading, isError, isFetching } = useSearchQuery(
    searchType,
    query,
    effectiveScopeIsTask ? { taskId: selectedTaskId } : undefined,
  );

  if (query.trim().length === 0) {
    return null;
  }

  return (
    <div className="px-2 pt-1.5 pb-3.5">
      <TypeToggle type={searchType} onChange={setSearchType} />
      <ScopeToggle
        scope={scope}
        onChange={setScope}
        canScopeToTask={selectedTaskId !== null}
      />
      {isLoading ? (
        <InlineState state="empty" dense>Searching…</InlineState>
      ) : isError || !data ? (
        <InlineState state="error" dense>Search failed.</InlineState>
      ) : data.tasks.length + data.events.length === 0 ? (
        <InlineState state="empty" dense>
          {`No matches for “${query.trim()}”.`}
        </InlineState>
      ) : (
        <>
          {isFetching && (
            <div className="text-center pb-1 font-mono text-mini text-ink-tertiary">
              updating…
            </div>
          )}
          {data.tasks.length > 0 && (
            <Section title="Tasks" count={data.tasks.length}>
              {data.tasks.map((hit) =>
                isMemoHit(hit) ? (
                  <MemoHitRow key={hit.id} hit={hit} />
                ) : (
                  <TaskHitRow key={hit.id} hit={hit} nowMs={nowMs} />
                ),
              )}
            </Section>
          )}
          {data.events.length > 0 && (
            <Section title="Events" count={data.events.length}>
              {data.events.map((hit) =>
                isMemoHit(hit) ? (
                  <MemoHitRow key={hit.id} hit={hit} />
                ) : (
                  <EventHitRow key={hit.id} hit={hit} />
                ),
              )}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

interface TypeToggleProps {
  readonly type: "tasks" | "events";
  readonly onChange: (type: "tasks" | "events") => void;
}

/** 히트 종류 하나만 골라 그 엔드포인트만 조회하게 하는 1차 토글이며, scope 토글과 독립이다. */
function TypeToggle({ type, onChange }: TypeToggleProps) {
  return (
    <div className="inline-flex p-0.5 mb-1.5 mx-1 rounded-sm bg-s1 border border-hair">
      <SegmentedButton active={type === "tasks"} onClick={() => onChange("tasks")}>
        Tasks
      </SegmentedButton>
      <SegmentedButton active={type === "events"} onClick={() => onChange("events")}>
        Events
      </SegmentedButton>
    </div>
  );
}

interface ScopeToggleProps {
  readonly scope: "all" | "this-task";
  readonly onChange: (scope: "all" | "this-task") => void;
  readonly canScopeToTask: boolean;
}

function ScopeToggle({ scope, onChange, canScopeToTask }: ScopeToggleProps) {
  return (
    <div className="inline-flex p-0.5 mb-2 mx-1 rounded-sm bg-s1 border border-hair">
      <SegmentedButton
        active={scope === "all"}
        onClick={() => onChange("all")}
      >
        All
      </SegmentedButton>
      <SegmentedButton
        active={scope === "this-task" && canScopeToTask}
        onClick={() => onChange("this-task")}
        disabled={!canScopeToTask}
        title={
          canScopeToTask
            ? "Limit results to the selected task"
            : "Pick a task first to scope search"
        }
      >
        This task
      </SegmentedButton>
    </div>
  );
}


interface SectionProps {
  readonly title: string;
  readonly count: number;
  readonly children: React.ReactNode;
}

function Section({ title, count, children }: SectionProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-1 font-sans text-mini font-medium tracking-label uppercase text-ink-tertiary">
        <span>{title}</span>
        <span className="rounded-xs bg-s1 px-1.5 font-mono text-mini text-ink-tertiary tracking-normal leading-4">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}


