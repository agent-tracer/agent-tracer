import type { VerdictStatus } from "~tracer-web/entities/rule/model/rule.js";
import type { TurnSplitSelection } from "~tracer-web/features/turn-split/index.js";
import { TurnSplitButton } from "~tracer-web/features/turn-split/index.js";
import { Hairline } from "~tracer-web/widgets/feed/timeline/Hairline.js";

interface TurnMarkProps {
  readonly turnIndex: number;
  readonly verdict: VerdictStatus | null;
  readonly status: "open" | "closed";
  readonly splitSelection?: TurnSplitSelection;
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
export function TurnMark({ turnIndex, verdict, status, splitSelection }: TurnMarkProps) {
  const tone = verdict ? VERDICT_TONE[verdict] : null;
  const accent = tone?.color ?? "var(--ink-tertiary)";
  const verdictLabel =
    tone?.label ?? (status === "open" ? "open" : "no verdict");

  return (
    <div
      className="group flex items-center gap-2.5 py-3 font-mono text-mini uppercase tracking-label"
      style={{ color: accent }}
    >
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
      <span>
        — Turn {turnIndex} · {verdictLabel} —
      </span>
      {splitSelection ? (
        <TurnSplitButton turnIndex={turnIndex} selection={splitSelection} />
      ) : null}
      <Hairline color={`color-mix(in srgb, ${accent} 45%, transparent)`} />
    </div>
  );
}
