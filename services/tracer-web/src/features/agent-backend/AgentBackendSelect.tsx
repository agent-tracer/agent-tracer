import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentUpstreamsQuery } from "~tracer-web/entities/agent-upstream/api/queries.js";
import {
  EMPTY_AGENT_UPSTREAM_CATALOG,
  reconcileAgentBackend,
  requiresAgentBackendChoice,
} from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { useAgentBackend } from "~tracer-web/features/agent-backend/use-agent-backend.js";
import { setAgentBackend } from "~tracer-web/shared/api/agent-backend.js";
import { Select } from "~tracer-web/shared/ui/index.js";

/** 배포가 상류를 둘 이상 선언했을 때만 보이며 고른 값이 에이전트 요청을 가른다. */
export function AgentBackendSelect() {
  const { data } = useAgentUpstreamsQuery();
  const catalog = data ?? EMPTY_AGENT_UPSTREAM_CATALOG;
  const selected = useAgentBackend();
  const queryClient = useQueryClient();

  useEffect(() => {
    const reconciled = reconcileAgentBackend(catalog, selected);
    if (reconciled !== selected) setAgentBackend(reconciled);
  }, [catalog, selected]);

  if (!requiresAgentBackendChoice(catalog)) return null;

  return (
    <Select
      aria-label="Agent backend"
      value={selected ?? ""}
      className="h-7 py-0 text-xs"
      onChange={(event) => {
        setAgentBackend(event.target.value === "" ? null : event.target.value);
        void queryClient.invalidateQueries();
      }}
    >
      <option value="">Choose backend</option>
      {catalog.upstreams.map((upstream) => (
        <option key={upstream.name} value={upstream.name}>
          {upstream.name}
        </option>
      ))}
    </Select>
  );
}
