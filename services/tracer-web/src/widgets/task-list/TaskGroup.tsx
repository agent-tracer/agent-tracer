interface TaskGroupHeaderProps {
  readonly label: string;
  readonly count: number;
}

/** Sentence case 밴드 라벨 + 단순 카운트. */
export function TaskGroupHeader({ label, count }: TaskGroupHeaderProps) {
  return (
    <div
      // 불투명 배경을 써서 헤더 아래로 스크롤되는 행이 반투명 캔버스
      // 색을 통해 비쳐 보이지 않게 한다.
      className="sticky top-0 z-10 flex items-baseline gap-2 px-3 pt-3 pb-1 font-sans text-meta font-semibold tracking-snug text-ink-muted bg-canvas"
    >
      <span>{label}</span>
      <span className="font-mono text-mini font-normal text-ink-tertiary tracking-normal">
        {count}
      </span>
    </div>
  );
}
