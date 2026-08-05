import {getJson} from "~plugin/config/http.js";

const AGENT_UPSTREAMS = "/api/agent/upstreams";

/** 배포가 선언한 에이전트 접수구 하나이며 이름이 곧 축의 이름이다. */
export interface AgentUpstream {
    readonly name: string;
}

export interface AgentUpstreamCatalog {
    readonly upstreams: readonly AgentUpstream[];
}

interface UpstreamsEnvelope {
    readonly data?: AgentUpstreamCatalog;
}

/** 상류가 둘 이상일 때만 부르는 쪽이 축을 고르고, 하나뿐이면 고를 것이 없다. */
export function resolveAgentBackend(
    catalog: AgentUpstreamCatalog,
    preferred: string | null,
): string | null {
    if (catalog.upstreams.length <= 1) return null;
    if (preferred !== null && catalog.upstreams.some((upstream) => upstream.name === preferred)) {
        return preferred;
    }
    return catalog.upstreams[0]?.name ?? null;
}

/** 축을 지목하지 않은 에이전트 요청은 게이트웨이가 400으로 거절하므로 이 자리에서 축을 싣는다. */
export function withAgentBackend(url: string, backend: string | null): string {
    if (backend === null) return url;
    return `${url}${url.includes("?") ? "&" : "?"}backend=${encodeURIComponent(backend)}`;
}

/** 배포가 이 데몬의 에이전트 요청을 어느 축으로 보낼지 못박은 값이다. */
export function preferredAgentBackend(env: NodeJS.ProcessEnv = process.env): string | null {
    const value = env.MONITOR_AGENT_BACKEND?.trim();
    return value !== undefined && value.length > 0 ? value : null;
}

/** 에이전트 요청이 향할 축이며 부르는 자리는 URL을 세울 때마다 이것에 묻는다. */
export interface AgentBackendPort {
    current(): Promise<string | null>;
}

/** 축을 고르지 않는 자리이며 상류가 하나뿐인 배포와 같은 요청을 낸다. */
export const NO_AGENT_BACKEND: AgentBackendPort = {
    current: (): Promise<string | null> => Promise.resolve(null),
};

/** 상류 목록을 읽어 축을 정하며, 목록을 읽지 못한 회차는 판단으로 남기지 않고 다음 요청에서 다시 묻는다. */
export class HttpAgentBackend implements AgentBackendPort {
    private settled: string | null = null;
    private resolved = false;
    private inflight: Promise<string | null> | null = null;

    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
        private readonly preferred: string | null = null,
    ) {}

    async current(): Promise<string | null> {
        if (this.resolved) return this.settled;
        this.inflight ??= this.readCatalog();
        const backend = await this.inflight;
        this.inflight = null;
        return backend;
    }

    private async readCatalog(): Promise<string | null> {
        const fetched = await getJson<UpstreamsEnvelope>(`${this.baseUrl}${AGENT_UPSTREAMS}`, this.headers);
        if (fetched.kind !== "found") return null;
        const catalog = fetched.value.data;
        if (catalog === undefined) return null;
        this.settled = resolveAgentBackend(catalog, this.preferred);
        this.resolved = true;
        return this.settled;
    }
}
