import type { DaemonHealthResponse } from "~tracer-web/entities/daemon/model/daemon-health.js";
import { getJson } from "~tracer-web/shared/api/client/json-methods.js";

export function fetchDaemonHealth(): Promise<DaemonHealthResponse> {
  return getJson<DaemonHealthResponse>("/api/v1/daemon-health");
}
