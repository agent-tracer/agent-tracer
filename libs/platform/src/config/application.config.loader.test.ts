import type { PathLike } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fsMock = vi.hoisted(() => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({ default: fsMock }));

function provideYaml(base: Record<string, unknown>, local?: Record<string, unknown>): void {
    fsMock.existsSync.mockImplementation((filePath: PathLike) =>
        !String(filePath).endsWith("application.local.yaml") || local !== undefined);
    fsMock.readFileSync.mockImplementation((filePath: PathLike) =>
        JSON.stringify(String(filePath).endsWith("application.local.yaml") ? local : base));
}

async function loadFreshConfig() {
    vi.resetModules();
    const { loadApplicationConfig } = await import("./application.config.loader.js");
    return loadApplicationConfig;
}

describe("loadApplicationConfig", () => {
    beforeEach(() => {
        fsMock.existsSync.mockReset();
        fsMock.readFileSync.mockReset();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("기본 YAML에 로컬 YAML과 환경변수를 순서대로 덮어쓴다", async () => {
        provideYaml(
            {
                profile: "prd",
                ingestApi: { port: 4101 },
                kafka: { brokers: ["base:9092"] },
            },
            {
                profile: "local",
                ingestApi: { port: 4201 },
                kafka: { brokers: ["local:9092"] },
            },
        );
        vi.stubEnv("INGEST_API_PORT", "4301");
        vi.stubEnv("KAFKA_BROKERS", "env-a:9092, ,env-b:9092");

        const loadApplicationConfig = await loadFreshConfig();
        const config = loadApplicationConfig();

        expect(config.profile).toBe("local");
        expect(config.ingestApi.port).toBe(4301);
        expect(config.kafka.brokers).toEqual(["env-a:9092", "env-b:9092"]);
    });

    it("환경변수가 바뀌어도 최초에 검증한 설정을 재사용한다", async () => {
        provideYaml({ ingestApi: { port: 4101 } });
        const loadApplicationConfig = await loadFreshConfig();

        const first = loadApplicationConfig();
        vi.stubEnv("INGEST_API_PORT", "4301");
        const second = loadApplicationConfig();

        expect(second).toBe(first);
        expect(second.ingestApi.port).toBe(4101);
    });

    it("잘못된 환경변수 포트를 스키마 검증에서 거부한다", async () => {
        provideYaml({});
        vi.stubEnv("PROJECTOR_PORT", "not-a-port");
        const loadApplicationConfig = await loadFreshConfig();

        expect(() => loadApplicationConfig()).toThrow();
    });

    it("두 데이터베이스에 같은 앱 계정으로 연결한다", async () => {
        provideYaml({});
        vi.stubEnv("POSTGRES_USER", "root");
        vi.stubEnv("POSTGRES_PASSWORD", "root-secret");

        const loadApplicationConfig = await loadFreshConfig();
        const config = loadApplicationConfig();

        expect(config.eventDb.username).toBe("root");
        expect(config.eventDb.password).toBe("root-secret");
        expect(config.tracerDb.username).toBe("root");
        expect(config.tracerDb.password).toBe("root-secret");
    });

    it("콜드 스토리지와 티어링 설정을 애플리케이션 설정에 노출하지 않는다", async () => {
        provideYaml({
            coldStore: { endpoint: "minio:9000" },
            tiering: { duckdbBin: "duckdb" },
        });
        vi.stubEnv("COLD_S3_ENDPOINT", "ignored:9000");
        vi.stubEnv("DUCKDB_BIN", "/usr/local/bin/duckdb");

        const loadApplicationConfig = await loadFreshConfig();
        const config = loadApplicationConfig();

        expect(config).not.toHaveProperty("coldStore");
        expect(config).not.toHaveProperty("tiering");
    });
});
