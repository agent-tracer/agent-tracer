export interface ProjectorRuntimeConfig {
    readonly searchOutboxDrainIntervalMs: number;
    readonly eventsOtlp: { readonly endpoint: string } | undefined;
}

type ProjectorRuntimeEnvironment = Readonly<Record<string, string | undefined>>;

const DEFAULTS = {
    searchOutboxDrainIntervalMs: 5_000,
} as const;

/** Projector 프로세스의 외부 운영 설정을 부트스트랩 입력으로 변환한다. */
export function loadProjectorRuntimeConfig(
    environment: ProjectorRuntimeEnvironment = process.env,
): ProjectorRuntimeConfig {
    const otlpEndpoint = environment["EVENTS_OTLP_ENDPOINT"]?.trim();
    return {
        searchOutboxDrainIntervalMs: positiveInt(
            environment,
            "PROJECTOR_SEARCH_OUTBOX_DRAIN_INTERVAL_MS",
            DEFAULTS.searchOutboxDrainIntervalMs,
        ),
        eventsOtlp: otlpEndpoint ? { endpoint: otlpEndpoint.replace(/\/$/, "") } : undefined,
    };
}

function positiveInt(environment: ProjectorRuntimeEnvironment, name: string, fallback: number): number {
    const raw = Number.parseInt(environment[name] ?? "", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}
