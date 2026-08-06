import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { DISABLED, TRANSITION } from "~tracer-web/shared/ui/lib/interactive.js";

interface SegmentedButtonProps extends ComponentPropsWithoutRef<"button"> {
  readonly active: boolean;
}

/** 배타적인 보기 하나를 고르는 버튼이며 `aria-pressed`까지 여기서 채운다. */
export function SegmentedButton({
  active,
  className,
  type = "button",
  ...rest
}: SegmentedButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2.5 rounded-xs",
        "text-meta font-medium border-b focus-ring",
        TRANSITION,
        DISABLED,
        active
          ? "bg-s3 text-ink border-hair-strong"
          : "bg-transparent text-ink-subtle border-transparent hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}
