import { useState } from "react";
import { useAgentUpstreamsQuery } from "~tracer-web/entities/agent-upstream/api/queries.js";
import {
  EMPTY_AGENT_UPSTREAM_CATALOG,
  resolveAgentBackend,
} from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";

export interface AgentBackendChoice {
  /** 상류가 하나 이하이면 null 이고 그때는 요청이 축을 지목하지 않는다. */
  readonly value: string | null;
  readonly select: (backend: string) => void;
}

/** 에이전트를 부르는 자리마다 하나씩 두며 자리끼리 값을 나누지 않는다. */
export function useAgentBackendChoice(): AgentBackendChoice {
  const { data } = useAgentUpstreamsQuery();
  const [chosen, setChosen] = useState<string | null>(null);
  return {
    value: resolveAgentBackend(data ?? EMPTY_AGENT_UPSTREAM_CATALOG, chosen),
    select: setChosen,
  };
}
