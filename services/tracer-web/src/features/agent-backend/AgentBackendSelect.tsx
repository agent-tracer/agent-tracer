import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentUpstreamsQuery } from "~tracer-web/entities/agent-upstream/api/queries.js";
import {
  requiresAgentBackendChoice,
  resolveAgentBackend,
} from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { useAgentBackend } from "~tracer-web/features/agent-backend/use-agent-backend.js";
import { setAgentBackend } from "~tracer-web/shared/api/agent-backend.js";
import { Select, StatusDot, Tooltip } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

/** 배포가 상류를 둘 이상 선언했을 때만 보이며 고른 값이 다음 요청부터 축을 가른다. */
export function AgentBackendSelect() {
  const { data: catalog } = useAgentUpstreamsQuery();
  const selected = useAgentBackend();
  const queryClient = useQueryClient();

  // 목록을 아직 모르는 동안에는 저장된 선택을 건드리지 않는다.
  useEffect(() => {
    if (catalog === undefined) return;
    const resolved = resolveAgentBackend(catalog, selected);
    if (resolved !== selected) setAgentBackend(resolved);
  }, [catalog, selected]);

  if (catalog === undefined || !requiresAgentBackendChoice(catalog)) return null;

  return (
    <Tooltip content="Agent backend. The next request runs on it" side="bottom">
      <div className="h-7 pl-2 pr-1 inline-flex items-center gap-1.5 rounded-sm border border-hair bg-s1">
        <StatusDot status="running" tooltip={false} />
        <span className="text-xs font-medium tracking-[-0.05px] text-ink-muted">Agent</span>
        <Select
          aria-label="Agent backend"
          value={selected ?? ""}
          className={cn(
            "h-6 py-0 pl-1 pr-5 text-xs font-medium text-ink",
            "border-none bg-transparent rounded-xs",
          )}
          onChange={(event) => {
            setAgentBackend(event.target.value);
            void queryClient.invalidateQueries();
          }}
        >
          {catalog.upstreams.map((upstream) => (
            <option key={upstream.name} value={upstream.name}>
              {upstream.name}
            </option>
          ))}
        </Select>
      </div>
    </Tooltip>
  );
}
