import { useEffect } from "react";
import { useAgentUpstreamsQuery } from "~tracer-web/entities/agent-upstream/api/queries.js";
import { resolveAgentBackend } from "~tracer-web/entities/agent-upstream/model/agent-upstream.js";
import { setDefaultAgentBackend } from "~tracer-web/shared/api/agent-backend.js";

/** 목록을 한 번 읽어, 축을 지목하지 않는 조회가 향할 곳을 요청 층에 알린다. */
export function useDefaultAgentBackend(): void {
  const { data } = useAgentUpstreamsQuery();

  useEffect(() => {
    if (data === undefined) return;
    setDefaultAgentBackend(resolveAgentBackend(data, null));
  }, [data]);
}
