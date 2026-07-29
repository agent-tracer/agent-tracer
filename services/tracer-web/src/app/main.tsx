import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "~tracer-web/app/App.js";
import { resolveAgentRemoteRoutes } from "~tracer-web/remote/resolve-agent-remote-routes.js";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root missing from index.html");
}

const remoteRoutes = await resolveAgentRemoteRoutes();

createRoot(rootElement).render(
  <StrictMode>
    <App remoteRoutes={remoteRoutes} />
  </StrictMode>,
);
