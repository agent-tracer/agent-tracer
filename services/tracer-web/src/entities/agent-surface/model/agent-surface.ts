import type { RouteObject } from "react-router-dom";

/** 에이전트 리모트가 셸 아래에 얹은 라우트의 경로 집합이다. */
export interface AgentSurface {
  readonly paths: readonly string[];
}

/** 에이전트가 배포에 없을 때의 표면이다. */
export const EMPTY_AGENT_SURFACE: AgentSurface = { paths: [] };

/** 라우터가 받은 라우트 배열 그대로에서 표면을 읽어, 단추와 라우트가 같은 근거를 본다. */
export function collectAgentSurface(routes: readonly RouteObject[]): AgentSurface {
  return {
    paths: routes
      .map((route) => route.path)
      .filter((path): path is string => path !== undefined)
      .map(normalize),
  };
}

/** 그 경로가 등록되지 않았으면 그리로 보내는 자리도 없다. */
export function hasAgentPath(surface: AgentSurface, path: string): boolean {
  return surface.paths.includes(normalize(path));
}

function normalize(path: string): string {
  return path.replace(/^\/+/, "");
}
