import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { InspectorPanel } from "~tracer-web/widgets/inspector/index.js";
import { TaskListPanel } from "~tracer-web/widgets/task-list/index.js";
import { TopBar } from "~tracer-web/widgets/topbar/index.js";
import type { ViewportTier } from "~tracer-web/shared/lib/hooks/use-viewport.js";
import { Drawer } from "~tracer-web/app/layout/Drawer.js";
import { ResizeHandle } from "~tracer-web/app/layout/ResizeHandle.js";
import { CollapsePanelTab, CollapsedPanelRail } from "~tracer-web/app/layout/PanelRail.js";
import { COLLAPSED_RAIL_WIDTH } from "~tracer-web/shared/store/slices/layoutSlice.js";

// Inspector의 Rules 탭은 다른 위젯 슬라이스라 조립부인 여기서 주입한다.
const RulesTab = lazy(() =>
  import("~tracer-web/widgets/rules/index.js").then((m) => ({ default: m.RulesTab })),
);

interface CompactAppLayoutProps {
  readonly viewport: Exclude<ViewportTier, "wide">;
  readonly wsConnected: boolean;
  readonly inspectorAvailable: boolean;
  readonly sidebarWidth: number;
  readonly inspectorWidth: number;
  readonly sidebarDrawerOpen: boolean;
  readonly sidebarCollapsed: boolean;
  readonly inspectorDrawerOpen: boolean;
  readonly onSidebarWidthChange: (width: number) => void;
  readonly onSidebarCollapsedChange: (collapsed: boolean) => void;
  readonly onSidebarDrawerOpenChange: (open: boolean) => void;
  readonly onInspectorDrawerOpenChange: (open: boolean) => void;
}

/** 좁은 뷰포트의 고정 사이드바와 모바일 보조 시트를 조합한다. */
export function CompactAppLayout({
  viewport,
  wsConnected,
  inspectorAvailable,
  sidebarWidth,
  inspectorWidth,
  sidebarDrawerOpen,
  sidebarCollapsed,
  inspectorDrawerOpen,
  onSidebarWidthChange,
  onSidebarCollapsedChange,
  onSidebarDrawerOpenChange,
  onInspectorDrawerOpenChange,
}: CompactAppLayoutProps) {
  const inspectorDrawerWidth = Math.min(inspectorWidth, viewport === "mobile" ? 380 : 460);

  return (
    <div
      className="grid h-screen min-h-0 overflow-hidden bg-canvas text-ink"
      style={{
        gridTemplateColumns: viewport === "narrow"
          ? `${sidebarCollapsed ? COLLAPSED_RAIL_WIDTH : sidebarWidth}px minmax(0, 1fr)`
          : "minmax(0, 1fr)",
        gridTemplateRows: "48px 1fr",
      }}
    >
      <header className="border-b border-hair" style={{ gridColumn: "1 / -1" }}>
        <TopBar wsConnected={wsConnected} viewport={viewport} />
      </header>

      {viewport === "narrow" && sidebarCollapsed ? (
        <CollapsedPanelRail side="left" label="Show task list" onAction={() => onSidebarCollapsedChange(false)} />
      ) : viewport === "narrow" ? (
        <aside className="relative border-r border-hair min-h-0 overflow-hidden" style={{ gridColumn: "1 / 2" }}>
          <TaskListPanel />
          <CollapsePanelTab side="left" label="Hide task list" onAction={() => onSidebarCollapsedChange(true)} />
          <ResizeHandle side="right" currentWidth={sidebarWidth} onResize={onSidebarWidthChange} />
        </aside>
      ) : null}

      <main className="min-w-0 min-h-0 overflow-y-auto" style={{ gridColumn: viewport === "narrow" ? "2 / 3" : "1 / -1" }}>
        <Outlet />
      </main>

      {viewport === "mobile" && sidebarDrawerOpen ? (
        <Drawer
          side="left"
          width={Math.min(sidebarWidth + 40, 340)}
          onDismiss={() => onSidebarDrawerOpenChange(false)}
          label="Task list"
        >
          <TaskListPanel />
        </Drawer>
      ) : null}

      {inspectorAvailable && inspectorDrawerOpen ? (
        <Drawer
          side="right"
          width={inspectorDrawerWidth}
          onDismiss={() => onInspectorDrawerOpenChange(false)}
          label="Inspector"
        >
          <InspectorPanel
            rulesTab={
              <Suspense fallback={null}>
                <RulesTab />
              </Suspense>
            }
          />
        </Drawer>
      ) : null}
    </div>
  );
}
