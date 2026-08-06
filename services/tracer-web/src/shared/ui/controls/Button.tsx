import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { DISABLED, TRANSITION } from "~tracer-web/shared/ui/lib/interactive.js";

/** 한 화면에서 채워진 `primary`는 하나만 두고 나머지는 `ghost`와 `danger`가 맡는다. */
type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  readonly variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover",
  ghost:
    "bg-transparent text-ink-muted border border-hair hover:text-ink hover:border-hair-strong",
  danger:
    "bg-transparent text-err border border-err hover:bg-err/12",
};

export function Button({ variant = "ghost", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "px-3 py-1.5 text-body font-medium rounded-xs focus-ring",
        TRANSITION,
        DISABLED,
        variantClass[variant],
        className,
      )}
      {...rest}
    />
  );
}
