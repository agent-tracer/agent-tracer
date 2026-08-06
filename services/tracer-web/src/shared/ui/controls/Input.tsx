import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { DISABLED, TRANSITION } from "~tracer-web/shared/ui/lib/interactive.js";

/** 폼 컨트롤은 옆에 서는 Button·Field 레이블과 같은 `text-body` 단을 쓴다. */
export const CONTROL_SURFACE =
  "px-2.5 py-1.5 text-body rounded-xs border border-hair bg-canvas text-ink placeholder:text-ink-tertiary focus-ring";

export function Input({ className, ...rest }: ComponentPropsWithoutRef<"input">) {
  return (
    <input className={cn(CONTROL_SURFACE, TRANSITION, DISABLED, className)} {...rest} />
  );
}
