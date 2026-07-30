import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchAgentUpstreams } from "~tracer-web/entities/agent-upstream/api/api-agent-upstreams.js";
import type { AgentUpstreamCatalog } from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

// 상류 집합은 배포가 바뀔 때만 달라지므로 화면이 도는 동안 다시 묻지 않는다.
export function useAgentUpstreamsQuery(): UseQueryResult<AgentUpstreamCatalog> {
  return useQuery({
    queryKey: monitorQueryKeys.agentUpstreams(),
    queryFn: fetchAgentUpstreams,
    staleTime: Infinity,
  });
}
