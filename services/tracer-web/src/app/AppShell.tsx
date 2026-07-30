import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getMonitorWsUrl } from "~tracer-web/shared/api/realtime/monitor-ws-url.js";
import { useViewport } from "~tracer-web/shared/lib/hooks/use-viewport.js";
import { useMonitorSocket } from "~tracer-web/app/realtime/use-monitor-socket.js";
import {
  useInspectorCollapsed,
  useInspectorDrawerOpen,
  useInspectorWidth,
  useSelectedTaskId,
  useSetInspectorCollapsed,
  useSetInspectorDrawerOpen,
  useSetInspectorWidth,
  useSetSidebarCollapsed,
  useSetSidebarDrawerOpen,
  useSetSidebarWidth,
  useSidebarCollapsed,
  useSidebarDrawerOpen,
  useSidebarWidth,
  useSyncSelectionFromRoute,
  useThemeAttrSync,
} from "~tracer-web/shared/store/index.js";
import { useDefaultAgentBackend } from "~tracer-web/features/agent-backend/use-default-agent-backend.js";
import { Toaster } from "~tracer-web/widgets/notifications/Toaster.js";
import { useJobToasts } from "~tracer-web/widgets/notifications/useJobToasts.js";
import { CompactAppLayout } from "~tracer-web/app/layout/CompactAppLayout.js";
import { ShortcutsOverlay } from "~tracer-web/app/layout/ShortcutsOverlay.js";
import { WideAppLayout } from "~tracer-web/app/layout/WideAppLayout.js";
import { useKeyboardShortcuts } from "~tracer-web/app/layout/useKeyboardShortcuts.js";

/** 앱 전역 동기화와 실시간 연결을 뷰포트별 레이아웃에 연결한다. */
export function AppShell() {
  useSyncSelectionFromRoute();
  useThemeAttrSync();
  useKeyboardShortcuts();
  useDefaultAgentBackend();

  const selectedTaskId = useSelectedTaskId();
  const viewport = useViewport();
  const [wsConnected, setWsConnected] = useState(false);
  const onJobMessage = useJobToasts();
  const sidebarWidth = useSidebarWidth();
  const inspectorWidth = useInspectorWidth();
  const setSidebarWidth = useSetSidebarWidth();
  const setInspectorWidth = useSetInspectorWidth();
  const sidebarCollapsed = useSidebarCollapsed();
  const inspectorCollapsed = useInspectorCollapsed();
  const setSidebarCollapsed = useSetSidebarCollapsed();
  const setInspectorCollapsed = useSetInspectorCollapsed();
  const sidebarDrawerOpen = useSidebarDrawerOpen();
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const setSidebarDrawerOpen = useSetSidebarDrawerOpen();
  const setInspectorDrawerOpen = useSetInspectorDrawerOpen();

  useMonitorSocket({
    url: getMonitorWsUrl(),
    selectedTaskId,
    onConnectionChange: setWsConnected,
    onMessage: onJobMessage,
  });

  useEffect(() => {
    if (viewport !== "wide") return;
    if (sidebarDrawerOpen) setSidebarDrawerOpen(false);
    if (inspectorDrawerOpen) setInspectorDrawerOpen(false);
  }, [
    viewport,
    sidebarDrawerOpen,
    inspectorDrawerOpen,
    setSidebarDrawerOpen,
    setInspectorDrawerOpen,
  ]);

  const location = useLocation();
  useEffect(() => {
    if (viewport !== "wide" && sidebarDrawerOpen) setSidebarDrawerOpen(false);
  }, [location.pathname]);

  const layout = viewport === "wide" ? (
    <WideAppLayout
      wsConnected={wsConnected}
      inspectorAvailable={selectedTaskId !== null}
      sidebarWidth={sidebarWidth}
      inspectorWidth={inspectorWidth}
      sidebarCollapsed={sidebarCollapsed}
      inspectorCollapsed={inspectorCollapsed}
      onSidebarWidthChange={setSidebarWidth}
      onInspectorWidthChange={setInspectorWidth}
      onSidebarCollapsedChange={setSidebarCollapsed}
      onInspectorCollapsedChange={setInspectorCollapsed}
    />
  ) : (
    <CompactAppLayout
      viewport={viewport}
      wsConnected={wsConnected}
      inspectorAvailable={selectedTaskId !== null}
      sidebarWidth={sidebarWidth}
      inspectorWidth={inspectorWidth}
      sidebarDrawerOpen={sidebarDrawerOpen}
      sidebarCollapsed={sidebarCollapsed}
      inspectorDrawerOpen={inspectorDrawerOpen}
      onSidebarWidthChange={setSidebarWidth}
      onSidebarCollapsedChange={setSidebarCollapsed}
      onSidebarDrawerOpenChange={setSidebarDrawerOpen}
      onInspectorDrawerOpenChange={setInspectorDrawerOpen}
    />
  );

  return (
    <>
      <ShortcutsOverlay />
      <Toaster />
      {layout}
    </>
  );
}
