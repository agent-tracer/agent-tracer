import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { CONTROL_SURFACE } from "~tracer-web/shared/ui/controls/Input.js";
import { DISABLED, TRANSITION } from "~tracer-web/shared/ui/lib/interactive.js";

export function Select({ className, children, ...rest }: ComponentPropsWithoutRef<"select">) {
  return (
    <select className={cn(CONTROL_SURFACE, TRANSITION, DISABLED, className)} {...rest}>
      {children}
    </select>
  );
}
