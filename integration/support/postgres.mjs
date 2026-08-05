// 통합 검사는 compose가 띄운 개발 스택 대신 검사마다 빈 컨테이너를 세워 개발 데이터를 건드리지 않는다.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// 자격은 compose/base.yml의 기본값과 같게 두고 데이터베이스 이름은 설정이 고정한 이름을 그대로 쓴다.
const USER = "root";
const PASSWORD = "root";

/** 원장 이행이 pg_partman을 요구하므로 소재지의 Dockerfile이 만드는 이미지를 쓴다. */
const EVENT_DB_IMAGE = "agent-tracer/event-db:integration";

/** 원장과 조회 모델이 각각 쓰는 데이터베이스 이름이며 application.config가 이 이름을 고정한다. */
export const DATABASES = Object.freeze({ event: "runtime", tracer: "tracer" });

/** testcontainers의 내장 빌더는 앞 단계의 RUN --mount을 처리하지 못하므로 BuildKit을 쓰는 docker build로 원장 이미지를 만든다. */
function buildEventDbImage() {
    const result = spawnSync(
        "docker",
        ["build", "--target", "event-db", "-t", EVENT_DB_IMAGE, ROOT],
        { encoding: "utf8", env: { ...process.env, DOCKER_BUILDKIT: "1" } },
    );
    if (result.status !== 0) {
        throw new Error(`원장 이미지 빌드 실패: ${result.stderr ?? result.error?.message ?? ""}`);
    }
}

/** pg_partman을 얹은 소재지 이미지와 Debezium이 읽는 논리 복제를 운영과 같게 갖춘 원장용 컨테이너 하나를 세운다. */
export async function startEventDb() {
    buildEventDbImage();
    return await new PostgreSqlContainer(EVENT_DB_IMAGE)
        .withDatabase(DATABASES.event)
        .withUsername(USER)
        .withPassword(PASSWORD)
        .withCommand(["postgres", "-c", "wal_level=logical"])
        .start();
}

/** 조회 모델용 컨테이너 하나를 세운다. */
export async function startTracerDb() {
    return await new PostgreSqlContainer("postgres:17-alpine")
        .withDatabase(DATABASES.tracer)
        .withUsername(USER)
        .withPassword(PASSWORD)
        .start();
}

/** 두 컨테이너의 접속 정보를 이행 도구가 읽는 환경 변수로 옮긴다. */
export function migrationEnv(eventDb, tracerDb) {
    return {
        MONITOR_PROFILE: "local",
        POSTGRES_USER: USER,
        POSTGRES_PASSWORD: PASSWORD,
        EVENT_DB_HOST: eventDb.getHost(),
        EVENT_DB_PORT: String(eventDb.getMappedPort(5432)),
        TRACER_DB_HOST: tracerDb.getHost(),
        TRACER_DB_PORT: String(tracerDb.getMappedPort(5432)),
    };
}
