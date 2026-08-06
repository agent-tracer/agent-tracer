import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

/** 상태 계열과 레인 위상 계열이 화면에서 나란히 서므로 색 이름을 한 표에 둔다. */
export type ChipTone =
  | "neutral"
  | "quiet"
  | "ok"
  | "warn"
  | "err"
  | "primary"
  | "user"
  | "asst"
  | "plan"
  | "expl"
  | "impl"
  | "rule"
  | "veri"
  | "coord";

interface ChipProps extends ComponentPropsWithoutRef<"span"> {
  readonly tone?: ChipTone;
}

/** 옅게 채운 배경과 또렷한 글자색이 칩 하나의 두 축이다. */
const toneClass: Record<ChipTone, string> = {
  neutral: "bg-s2 text-ink-muted",
  quiet: "bg-s2 text-ink-tertiary",
  ok: "bg-ok/14 text-ok",
  warn: "bg-warn/14 text-warn",
  err: "bg-err/14 text-err",
  primary: "bg-primary/18 text-primary-hover",
  user: "bg-ph-user/14 text-ph-user",
  asst: "bg-ph-asst/14 text-ph-asst",
  plan: "bg-ph-plan/14 text-ph-plan",
  expl: "bg-ph-expl/14 text-ph-expl",
  impl: "bg-ph-impl/14 text-ph-impl",
  rule: "bg-ph-rule/14 text-ph-rule",
  veri: "bg-ph-veri/14 text-ph-veri",
  coord: "bg-ph-coord/14 text-ph-coord",
};

/** 분류를 한 낱말로 붙이는 표식이며 테두리를 두른 알약이 필요하면 [Pill]이다. */
export function Chip({ tone = "neutral", className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs px-1.5",
        "font-mono text-micro leading-4 font-semibold uppercase tracking-eyebrow",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
