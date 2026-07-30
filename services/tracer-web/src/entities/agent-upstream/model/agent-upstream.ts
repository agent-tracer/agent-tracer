/** 배포가 선언한 에이전트 접수구 하나이며 이름이 그대로 표시 이름이다. */
export interface AgentUpstream {
  readonly name: string;
}

export interface AgentUpstreamCatalog {
  readonly upstreams: readonly AgentUpstream[];
}

/** 에이전트가 배포에 없을 때의 목록이다. */
export const EMPTY_AGENT_UPSTREAM_CATALOG: AgentUpstreamCatalog = { upstreams: [] };

/** 상류가 둘 이상일 때만 부르는 쪽이 고르고, 하나뿐이면 고를 것이 없다. */
export function requiresAgentBackendChoice(catalog: AgentUpstreamCatalog): boolean {
  return catalog.upstreams.length > 1;
}

/** 선언에 없는 선택은 배포가 달라졌다는 뜻이므로 버린다. */
export function reconcileAgentBackend(
  catalog: AgentUpstreamCatalog,
  selected: string | null,
): string | null {
  if (selected === null) return null;
  if (!requiresAgentBackendChoice(catalog)) return null;
  return catalog.upstreams.some((upstream) => upstream.name === selected) ? selected : null;
}
