import { useAgentUpstreamsQuery } from "~tracer-web/entities/agent-upstream/api/queries.js";
import {
  EMPTY_AGENT_UPSTREAM_CATALOG,
  requiresAgentBackendChoice,
} from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { Select } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface AgentBackendSelectProps {
  readonly value: string | null;
  readonly onChange: (backend: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

/** 이 자리의 요청이 향할 상류를 고르며 배포가 상류를 둘 이상 선언했을 때만 보인다. */
export function AgentBackendSelect({
  value,
  onChange,
  disabled = false,
  className,
}: AgentBackendSelectProps) {
  const { data } = useAgentUpstreamsQuery();
  const catalog = data ?? EMPTY_AGENT_UPSTREAM_CATALOG;

  if (!requiresAgentBackendChoice(catalog)) return null;

  return (
    <Select
      aria-label="Agent backend"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn("text-xs", className)}
    >
      {catalog.upstreams.map((upstream) => (
        <option key={upstream.name} value={upstream.name}>
          {upstream.name}
        </option>
      ))}
    </Select>
  );
}
