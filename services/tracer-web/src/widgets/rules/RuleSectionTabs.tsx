import { cn } from "~tracer-web/shared/ui/lib/cn.js";

export type RuleSectionTab = "rules" | "generations";

interface RuleSectionTabsProps {
  readonly active: RuleSectionTab;
  readonly onSelect: (tab: RuleSectionTab) => void;
  readonly counts: { readonly rules: number; readonly generations: number };
  /** 도는 실행이 있으면 다른 탭에 있어도 알 수 있게 표시한다. */
  readonly runningGenerations: number;
}

/** `/rules`의 규칙 목록과 생성 실행 이력을 가르는 탭이다. */
export function RuleSectionTabs({
  active,
  onSelect,
  counts,
  runningGenerations,
}: RuleSectionTabsProps) {
  const tabs: ReadonlyArray<{
    readonly key: RuleSectionTab;
    readonly label: string;
    readonly count: number;
  }> = [
    { key: "rules", label: "Rules", count: counts.rules },
    { key: "generations", label: "Generations", count: counts.generations },
  ];

  return (
    <div className="flex gap-1 px-9 border-b border-hair bg-canvas">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(tab.key)}
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "py-2 px-3 border-none bg-transparent text-body cursor-pointer flex items-center gap-1.5 border-b-2",
            active === tab.key
              ? "text-ink font-semibold border-primary"
              : "text-ink-muted font-medium border-transparent hover:text-ink",
          )}
        >
          {tab.label}
          <span className="font-mono text-mini px-1.5 rounded-pill bg-s1 text-ink-tertiary min-w-[18px] text-center">
            {tab.count}
          </span>
          {tab.key === "generations" && runningGenerations > 0 && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
              aria-label={`${runningGenerations} in flight`}
            />
          )}
        </button>
      ))}
    </div>
  );
}
