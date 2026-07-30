import { loadRemote, registerRemotes } from "@module-federation/runtime";
import type { RouteObject } from "react-router-dom";

// 리모트 진입점은 배포마다 고정된 경로이며 없으면 프록시도 없어 자연스럽게 404다.
const AGENT_REMOTE_ENTRY = "/agent/remoteEntry.js";

interface AgentRoutesModule {
  readonly default: readonly RouteObject[];
}

/**
 * 에이전트 리모트의 `./routes`를 연합으로 받아오되, 진입점이 없거나 응답하지 않으면
 * "설치되지 않음"으로 읽고 빈 배열을 돌려주며 그 사실을 한 번만 기록한다.
 */
export async function resolveAgentRemoteRoutes(): Promise<readonly RouteObject[]> {
  registerRemotes([{ name: "agent", entry: AGENT_REMOTE_ENTRY, type: "module" }]);

  try {
    const remote = await loadRemote<AgentRoutesModule>("agent/routes");
    return remote?.default ?? [];
  } catch (error) {
    console.warn("에이전트 리모트를 찾지 못해 해당 라우트를 등록하지 않는다", error);
    return [];
  }
}
