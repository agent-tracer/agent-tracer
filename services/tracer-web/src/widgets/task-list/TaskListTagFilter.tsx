import { useTagsQuery } from "~tracer-web/entities/tag/api/queries.js";
import { TagChip } from "~tracer-web/entities/tag/ui/TagChip.js";
import {
  useClearSidebarTagFilter,
  useGuidance,
  useSidebarTagFilter,
  useToggleSidebarTagFilter,
} from "~tracer-web/shared/store/index.js";
import { GuidanceText, Tooltip } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

/** 사이드바 검색 아래에서 선택한 태그를 모두 가진 태스크만 남기며 태그가 없으면 렌더링하지 않는다. */
export function TaskListTagFilter() {
  const guidance = useGuidance();
  const { data } = useTagsQuery();
  const selected = useSidebarTagFilter();
  const toggle = useToggleSidebarTagFilter();
  const clear = useClearSidebarTagFilter();
  const tags = data?.tags ?? [];
  const selectedSet = new Set(selected);

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-2.5 pb-1.5">
      <Tooltip
        content={<GuidanceText locale={guidance.locale} message={guidance.messages.tags.filterDescription} />}
      >
        <span className="font-mono text-mini uppercase tracking-eyebrow text-ink-tertiary mr-0.5">
          Tags
        </span>
      </Tooltip>
      {/* 태그는 어디에서나 같은 표식으로 보이고 고른 것인지 아닌지만 선명도로 갈린다. */}
      {tags.map((tag) => {
        const isOn = selectedSet.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            aria-pressed={isOn}
            aria-label={`Filter by ${tag.name}`}
            className={cn(
              "rounded-xs transition-opacity duration-150 focus-ring",
              isOn
                ? "opacity-100 ring-1 ring-hair-strong"
                : "opacity-50 hover:opacity-100",
            )}
          >
            <TagChip tag={tag} dense />
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="text-mini text-ink-tertiary underline decoration-dotted underline-offset-2 hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
