let defaultBackend: string | null = null;

/** 부르는 자리가 축을 지목하지 않은 에이전트 요청이 향하는 곳이며 선언의 첫 상류다. */
export function getDefaultAgentBackend(): string | null {
  return defaultBackend;
}

export function setDefaultAgentBackend(backend: string | null): void {
  defaultBackend = backend;
}
