import { useSyncExternalStore } from "react";

let defaultBackend: string | null = null;
let settled = false;
const listeners = new Set<() => void>();

/** 부르는 자리가 축을 지목하지 않은 에이전트 요청이 향하는 곳이며 선언의 첫 상류다. */
export function getDefaultAgentBackend(): string | null {
  return defaultBackend;
}

export function setDefaultAgentBackend(backend: string | null): void {
  defaultBackend = backend;
  settled = true;
  for (const listen of listeners) listen();
}

function subscribe(listen: () => void): () => void {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

/** 축을 요구하는 조회가 목록을 읽기 전에 나가면 축 없는 요청이 되어 거절당한다. */
export function useAgentBackendSettled(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => settled,
    () => false,
  );
}
