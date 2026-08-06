import { Link } from "react-router-dom";
import type { ViewportTier } from "~tracer-web/shared/lib/hooks/use-viewport.js";

interface BrandMarkProps {
  /** 생략 가능. */
  readonly viewport?: ViewportTier;
}

/** topbar 맨 왼쪽 요소. */
export function BrandMark({ viewport = "wide" }: BrandMarkProps) {
  return (
    <Link
      to="/tasks"
      aria-label="Go to task list"
      className="flex items-center gap-2.5 shrink-0 no-underline"
      // 248은 넓은 셸의 첫 열에 맞추는 폭이며, 그 열이 없는 화면에서는 자리만 먹는다.
      style={viewport === "wide" ? { minWidth: 248 } : undefined}
    >
      <div className="flex items-center justify-center w-[22px] h-[22px] rounded-sm bg-primary text-on-primary text-body font-semibold tracking-display">
        A
      </div>
      {viewport !== "mobile" && (
        <div className="text-lead font-medium tracking-snug text-ink">
          Agent Tracer
        </div>
      )}
    </Link>
  );
}
