import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { DISABLED, TRANSITION } from "~tracer-web/shared/ui/lib/interactive.js";

type IconButtonTone = "neutral" | "danger";

interface IconButtonProps extends ComponentPropsWithoutRef<"button"> {
  readonly tone?: IconButtonTone;
  /** 2클릭 확인(useConfirmAction 참조)이 armed 상태인 동안 true. */
  readonly armed?: boolean;
}

const toneClass: Record<IconButtonTone, string> = {
  neutral: "text-ink-tertiary border-hair hover:text-ink hover:border-hair-strong",
  danger: "text-err border-err hover:bg-err/12",
};

export function IconButton({
  tone = "neutral",
  armed = false,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center h-6 w-6 rounded-xs border focus-ring",
        TRANSITION,
        DISABLED,
        armed ? "bg-err/14 text-err border-err" : toneClass[tone],
        className,
      )}
      {...rest}
    />
  );
}
