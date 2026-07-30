const AGENT_BACKEND_STORAGE_KEY = "monitor.agentBackend";

function readStored(): string | null {
  try {
    const value = window.localStorage.getItem(AGENT_BACKEND_STORAGE_KEY)?.trim();
    return value ? value : null;
  } catch {
    return null;
  }
}

let selected: string | null = readStored();
const listeners = new Set<() => void>();

/** 게이트웨이가 상류를 둘 이상 선언했을 때 요청이 어느 상류로 갈지 고르는 값이다. */
export function getAgentBackend(): string | null {
  return selected;
}

export function setAgentBackend(backend: string | null): void {
  if (selected === backend) return;
  selected = backend;
  try {
    if (backend === null) window.localStorage.removeItem(AGENT_BACKEND_STORAGE_KEY);
    else window.localStorage.setItem(AGENT_BACKEND_STORAGE_KEY, backend);
  } catch {
    // 저장소가 막혀도 이번 세션의 선택은 그대로 쓴다.
  }
  for (const listener of listeners) listener();
}

export function subscribeAgentBackend(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
