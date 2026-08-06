import * as RxTabs from "@radix-ui/react-tabs";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { DISABLED, TRANSITION } from "~tracer-web/shared/ui/lib/interactive.js";

export const Tabs = RxTabs.Root;

export const TabsList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RxTabs.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <RxTabs.List
      ref={ref}
      className={cn("flex border-b border-hair px-3.5", className)}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof RxTabs.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <RxTabs.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-3 -mb-px",
        "text-body font-medium text-ink-subtle",
        "border-b-2 border-transparent hover:text-ink",
        "data-[state=active]:text-ink data-[state=active]:border-primary",
        "focus-ring",
        TRANSITION,
        DISABLED,
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RxTabs.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <RxTabs.Content ref={ref} className={cn("flex-1", className)} {...props} />;
});
