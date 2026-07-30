import { createContext, useContext, type ReactNode } from "react";
import {
  EMPTY_AGENT_SURFACE,
  type AgentSurface,
} from "~tracer-web/entities/agent-surface/model/agent-surface.js";

const AgentSurfaceContext = createContext<AgentSurface>(EMPTY_AGENT_SURFACE);

interface AgentSurfaceProviderProps {
  readonly surface: AgentSurface;
  readonly children: ReactNode;
}

/** 라우터에 얹힌 표면을 셸 아래 전체가 보게 한다. */
export function AgentSurfaceProvider({ surface, children }: AgentSurfaceProviderProps) {
  return (
    <AgentSurfaceContext.Provider value={surface}>{children}</AgentSurfaceContext.Provider>
  );
}

export function useAgentSurface(): AgentSurface {
  return useContext(AgentSurfaceContext);
}
