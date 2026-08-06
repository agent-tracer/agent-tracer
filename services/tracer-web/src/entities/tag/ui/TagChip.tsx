import type { TagRecord } from "~tracer-web/entities/tag/model/tag.js";
import { readableForeground } from "~tracer-web/entities/tag/lib/tag-contrast.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface TagChipProps {
  readonly tag: Pick<TagRecord, "id" | "name" | "color">;
  /** 사이드바 행처럼 촘촘한 자리에서 한 단 작게 그린다. */
  readonly dense?: boolean;
  /** 지정하면 칩에 제거 버튼이 붙어 태스크 태그 피커의 선택된 태그 목록이 쓴다. */
  readonly onRemove?: () => void;
}

/** 모양은 [Chip]과 같은 가족이고 색만 사용자가 정하는 태그 하나의 표식이다. */
export function TagChip({ tag, dense = false, onRemove }: TagChipProps) {
  const foreground = readableForeground(tag.color);

  return (
    <span
      title={tag.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 rounded-xs",
        "font-medium leading-4 whitespace-nowrap max-w-40",
        dense ? "px-1 text-micro min-w-[18px]" : "px-1.5 py-px text-meta min-w-[22px]",
      )}
      style={{ backgroundColor: tag.color, color: foreground }}
    >
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${tag.name}`}
          className="inline-flex items-center justify-center opacity-80 hover:opacity-100 focus-ring"
          style={{ color: foreground }}
        >
          ×
        </button>
      )}
    </span>
  );
}
