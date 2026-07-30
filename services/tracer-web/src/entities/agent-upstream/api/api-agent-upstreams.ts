import {
  EMPTY_AGENT_UPSTREAM_CATALOG,
  type AgentUpstreamCatalog,
} from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { getJson } from "~tracer-web/shared/api/client/json-methods.js";
import { isNotImplementedError } from "~tracer-web/shared/api/client/response.js";

// 상류 목록은 배포 선언이 정하므로 게이트웨이가 답한다.
const AGENT_UPSTREAMS = "/api/agent/upstreams";

export async function fetchAgentUpstreams(): Promise<AgentUpstreamCatalog> {
  try {
    return await getJson<AgentUpstreamCatalog>(AGENT_UPSTREAMS);
  } catch (error) {
    if (isNotImplementedError(error)) return EMPTY_AGENT_UPSTREAM_CATALOG;
    throw error;
  }
}
