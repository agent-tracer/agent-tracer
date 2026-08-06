import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { CONTROL_SURFACE } from "~tracer-web/shared/ui/controls/Input.js";
import { DISABLED, TRANSITION } from "~tracer-web/shared/ui/lib/interactive.js";

/** Input과 같은 표면을 쓰되 세로 리사이즈만 허용하는 여러 줄 입력이다. */
export function Textarea({ className, ...rest }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(CONTROL_SURFACE, TRANSITION, DISABLED, "resize-y leading-normal", className)}
      {...rest}
    />
  );
}
