import type { ReactNode } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

export function SectionLabel({ className, children }: { readonly className?: string; readonly children: ReactNode }) {
  return (
    <div className={cn("font-mono text-mini uppercase tracking-eyebrow text-ink-tertiary font-semibold", className)}>
      {children}
    </div>
  );
}
