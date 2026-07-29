import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, type RouteObject } from "react-router-dom";
import { createRouter } from "./router.js";
import { ThemeProvider } from "~tracer-web/app/layout/ThemeProvider.js";
import { AppErrorBoundary } from "~tracer-web/app/AppErrorBoundary.js";
import { UiStoreProvider } from "~tracer-web/shared/store/index.js";
import { monitorQueryClient } from "~tracer-web/shared/api/query-client.js";

interface AppProps {
  readonly remoteRoutes?: readonly RouteObject[];
}

export default function App({ remoteRoutes = [] }: AppProps) {
  // 재렌더링에도 안정적이다.
  const [router] = useState(() => createRouter(remoteRoutes));

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={monitorQueryClient}>
          <UiStoreProvider>
            <RouterProvider router={router} />
          </UiStoreProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
