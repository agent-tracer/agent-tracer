import type { VerdictStatus } from "~tracer-web/entities/rule/model/rule.js";
import { Hairline } from "~tracer-web/widgets/feed/timeline/Hairline.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

/** 턴 밴드가 여는 분리 선택 상태다. */
export type TurnSplitSelection = "idle" | "start" | "end";

interface TurnMarkProps {
  readonly turnIndex: number;
  readonly verdict: VerdictStatus | null;
  readonly status: "open" | "closed";
  /** 세션이 아직 실행 중이면 분리할 수 없다. */
  readonly splittable?: boolean;
  readonly selection?: TurnSplitSelection;
  readonly onSplitFrom?: (turnIndex: number) => void;
}

const VERDICT_TONE: Record<
  VerdictStatus,
  { readonly label: string; readonly color: string }
> = {
  satisfied: { label: "fulfilled", color: "var(--ok)" },
  unmet: { label: "unmet", color: "var(--err)" },
  open: { label: "not yet", color: "var(--warn)" },
  unknown: { label: "unverified", color: "var(--ink-tertiary)" },
};

/** 새 턴 밴드를 여는 구분선. */
export function TurnMark({
  turnIndex,
  verdict,
  status,
  splittable = false,
  selection = "idle",
  onSplitFrom,
}: TurnMarkProps) {
  const guidance = useGuidance();
  const tone = verdict ? VERDICT_TONE[verdict] : null;
  const accent = tone?.color ?? "var(--ink-tertiary)";
  const verdictLabel =
    tone?.label ?? (status === "open" ? "open" : "no verdict");
  const canSplit = splittable && onSplitFrom !== undefined;

  return (
    <div
      className="group flex items-center gap-2.5 py-3 font-mono text-[10.5px] uppercase tracking-[0.04em]"
      style={{ color: accent }}
    >
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
      <span>
        — Turn {turnIndex + 1} · {verdictLabel} —
      </span>
      {canSplit ? (
        <button
          type="button"
          onClick={() => onSplitFrom(turnIndex)}
          className={
            selection === "idle"
              ? "opacity-0 transition-opacity group-hover:opacity-100"
              : "underline underline-offset-2"
          }
        >
          {selection === "start" ? "pick end" : "split"}
        </button>
      ) : null}
      {selection === "start" ? (
        <GuidanceText
          locale={guidance.locale}
          message={guidance.messages.feed.splitTurnsAction}
        />
      ) : null}
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
    </div>
  );
}
