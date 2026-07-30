import { useSyncExternalStore } from "react";
import { getAgentBackend, subscribeAgentBackend } from "~tracer-web/shared/api/agent-backend.js";

/** 고른 상류는 요청을 보내는 층이 갖고 있으므로 화면은 그 값을 구독해서 읽는다. */
export function useAgentBackend(): string | null {
  return useSyncExternalStore(subscribeAgentBackend, getAgentBackend, getAgentBackend);
}
