import type { ReactNode } from "react";
import type { TagRecord } from "~tracer-web/entities/tag/model/tag.js";
import { TagChip } from "~tracer-web/entities/tag/ui/TagChip.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface TagChipListProps {
  readonly tags: readonly Pick<TagRecord, "id" | "name" | "color">[];
  /** 이 개수를 넘는 태그는 "+N" 배지로 접힌다. */
  readonly maxVisible?: number;
  /** 사이드바 행처럼 촘촘한 자리에서 한 단 작게 그린다. */
  readonly dense?: boolean;
  readonly emptyFallback?: ReactNode;
}

/** 태스크 헤더와 목록 행이 함께 쓰는 태그 칩 한 줄이다. */
export function TagChipList({
  tags,
  maxVisible = 4,
  dense = false,
  emptyFallback = null,
}: TagChipListProps) {
  if (tags.length === 0) return <>{emptyFallback}</>;

  const visible = tags.slice(0, maxVisible);
  const overflowCount = tags.length - visible.length;

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      {visible.map((tag) => (
        <TagChip key={tag.id} tag={tag} dense={dense} />
      ))}
      {overflowCount > 0 && (
        <span
          className={cn(
            "shrink-0 font-mono text-ink-tertiary",
            dense ? "text-micro" : "text-mini",
          )}
          title={`${overflowCount} more tags`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}
