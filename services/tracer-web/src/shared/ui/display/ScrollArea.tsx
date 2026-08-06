import * as RxScroll from "@radix-ui/react-scroll-area";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type Ref,
  type UIEventHandler,
} from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface ScrollAreaProps extends ComponentPropsWithoutRef<
  typeof RxScroll.Root
> {
  readonly viewportRef?: Ref<HTMLDivElement>;
  readonly onViewportScroll?: UIEventHandler<HTMLDivElement>;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    { className, children, viewportRef, onViewportScroll, ...props },
    ref,
  ) {
    return (
      <RxScroll.Root
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {/* Radix가 뷰포트 안쪽을 인라인 스타일 `display:table`로 깔아 폭이 내용에 끌려가므로
            블록으로 되돌려야 자식이 패널 폭 안에서 잘린다. */}
        <RxScroll.Viewport
          ref={viewportRef}
          className="h-full w-full [&>div]:block!"
          onScroll={onViewportScroll}
        >
          {children}
        </RxScroll.Viewport>
        <RxScroll.Scrollbar
          orientation="vertical"
          className="flex w-2 select-none touch-none p-[2px] transition-colors duration-150"
        >
          <RxScroll.Thumb className="relative flex-1 rounded-full bg-hair hover:bg-hair-strong" />
        </RxScroll.Scrollbar>
        <RxScroll.Corner />
      </RxScroll.Root>
    );
  },
);
