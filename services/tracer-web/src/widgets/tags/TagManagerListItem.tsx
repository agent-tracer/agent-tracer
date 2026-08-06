import type { TagSummaryRecord } from "~tracer-web/entities/tag/model/tag.js";
import { TagChip } from "~tracer-web/entities/tag/ui/TagChip.js";
import { Button } from "~tracer-web/shared/ui/index.js";

interface TagManagerListItemProps {
  readonly tag: TagSummaryRecord;
  readonly onEdit: (tag: TagSummaryRecord) => void;
  readonly onDelete: (tag: TagSummaryRecord) => void;
  readonly onViewTasks: (tag: TagSummaryRecord) => void;
}

/** 태그 관리 목록의 행 하나이며 색 견본과 설명과 태스크 개수와 편집 액션을 보여준다. */
export function TagManagerListItem({ tag, onEdit, onDelete, onViewTasks }: TagManagerListItemProps) {
  return (
    <article className="bg-s1 border border-hair rounded-md py-3 px-3.5 flex flex-col gap-2">
      {/* 태그와 그 태그가 붙은 수는 왼쪽에서 함께 읽고 행동은 오른쪽에 모은다. */}
      <div className="flex items-center gap-2.5">
        <TagChip tag={tag} />
        <button
          type="button"
          onClick={() => onViewTasks(tag)}
          className="font-mono text-mini text-ink-muted underline decoration-dotted underline-offset-2 hover:text-ink focus-ring"
        >
          {tag.taskCount} task{tag.taskCount === 1 ? "" : "s"}
        </button>
        <span className="flex-1" />
        <Button variant="ghost" onClick={() => onEdit(tag)}>
          Edit
        </Button>
        <Button variant="danger" onClick={() => onDelete(tag)}>
          Delete
        </Button>
      </div>

      {tag.description && (
        <p className="m-0 text-body text-ink-subtle leading-normal">{tag.description}</p>
      )}
    </article>
  );
}
