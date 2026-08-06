import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

type PillTone = "neutral" | "ok" | "warn" | "err" | "primary";

interface PillProps extends ComponentPropsWithoutRef<"span"> {
  readonly tone?: PillTone;
  /** tone과 맞는 색의 작은 상태 dot을 앞에 표시한다. */
  readonly dot?: boolean;
  /** 앞의 dot을 펄스시킨다(`dot`이 true일 때만 적용). */
  readonly pulse?: boolean;
}

const toneText: Record<PillTone, string> = {
  neutral: "text-ink-subtle",
  ok: "text-ok",
  warn: "text-warn",
  err: "text-err",
  primary: "text-accent",
};

const toneDot: Record<PillTone, string> = {
  neutral: "bg-ink-subtle",
  ok: "bg-ok",
  warn: "bg-warn",
  err: "bg-err",
  primary: "bg-primary",
};

/** 테두리만 두른 알약이 한 대상의 지금 상태를 말하며 분류는 [Chip]이 맡는다. */
export function Pill({
  tone = "neutral",
  dot = false,
  pulse = false,
  className,
  children,
  ...rest
}: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-hair bg-transparent",
        "px-2 py-[2px] font-mono text-mini",
        toneText[tone],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden
          className={cn("h-[5px] w-[5px] rounded-full", toneDot[tone])}
          style={pulse ? { animation: "pulse 1.8s ease-in-out infinite" } : undefined}
        />
      )}
      {children}
    </span>
  );
}
