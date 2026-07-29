import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "~tracer-web/app/AppShell.js";
import TasksRoute from "~tracer-web/pages/tasks/TasksPage.js";
import TaskRoute from "~tracer-web/pages/task/TaskPage.js";
import NotFound from "~tracer-web/pages/not-found/NotFoundPage.js";
import { RulesPage } from "~tracer-web/pages/rules/RulesPage.js";
import { MemosPage } from "~tracer-web/pages/memos/MemosPage.js";
import { TagsPage } from "~tracer-web/pages/tags/TagsPage.js";
import { RecipesPage } from "~tracer-web/pages/recipes/RecipesPage.js";
import { SettingsPage } from "~tracer-web/pages/settings/SettingsPage.js";
import type { RouteObject } from "react-router-dom";

/**
 * 라우트: `/`는 `/tasks`로, `/tasks`는 사이드바만, `/tasks/:taskId`는 운영자 뷰, 나머지는
 * 워크스페이스 화면이며 매칭되지 않으면 404이고, `remoteRoutes`는 연합 리모트가 얹는 자리다.
 */
export function buildRouteChildren(remoteRoutes: readonly RouteObject[]): RouteObject[] {
  return [
    { index: true, element: <Navigate to="/tasks" replace /> },
    { path: "tasks", element: <TasksRoute /> },
    { path: "tasks/:taskId", element: <TaskRoute /> },
    { path: "rules", element: <RulesPage /> },
    { path: "memos", element: <MemosPage /> },
    { path: "tags", element: <TagsPage /> },
    { path: "recipes", element: <RecipesPage /> },
    ...remoteRoutes,
    { path: "settings", element: <SettingsPage /> },
    { path: "*", element: <NotFound /> },
  ];
}

export function createRouter(remoteRoutes: readonly RouteObject[] = []) {
  return createBrowserRouter([
    {
      element: <AppShell />,
      children: buildRouteChildren(remoteRoutes),
    },
  ]);
}
