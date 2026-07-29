export { UiStoreProvider, useUiStore } from "~tracer-web/shared/store/UiStoreProvider.js";
export { createUiStore, type UiStore, type UiStoreApi } from "~tracer-web/shared/store/createUiStore.js";

export type { SelectionSlice } from "~tracer-web/shared/store/slices/selectionSlice.js";
export type { ViewSlice, InspectorTab, MainView } from "~tracer-web/shared/store/slices/viewSlice.js";
export type {
  SidebarSlice,
  SidebarFilter,
  SidebarView,
} from "~tracer-web/shared/store/slices/sidebarSlice.js";
export { SIDEBAR_FILTERS } from "~tracer-web/shared/store/slices/sidebarSlice.js";
export type { LayoutSlice } from "~tracer-web/shared/store/slices/layoutSlice.js";
export type { ThemeSlice, Theme } from "~tracer-web/shared/store/slices/themeSlice.js";
export type { GuidanceLocaleSlice } from "~tracer-web/shared/store/slices/guidanceLocaleSlice.js";

export * from "~tracer-web/shared/store/hooks.js";
export { useGuidance } from "~tracer-web/shared/store/useGuidance.js";
export { useSyncSelectionFromRoute } from "~tracer-web/shared/store/sync/useRouteSync.js";
export { useThemeAttrSync } from "~tracer-web/shared/store/sync/useThemeAttrSync.js";
export {
  useSystemColorScheme,
  type ColorScheme,
} from "~tracer-web/shared/store/sync/useSystemColorScheme.js";
