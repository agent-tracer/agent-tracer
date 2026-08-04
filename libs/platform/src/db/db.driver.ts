/** 지원하는 데이터베이스 방언이다. */
export type DbDriver = "postgres" | "sqlite";

/** 방언을 sqlite로 내리는 프로파일 이름이다. */
export const SQLITE_PROFILE = "sqlite";

/** 엔티티 데코레이터가 평가되는 시점에 확정돼야 하므로 프로파일을 환경변수에서만 읽는다. */
export function resolveDbDriver(env: NodeJS.ProcessEnv = process.env): DbDriver {
    return env["MONITOR_PROFILE"] === SQLITE_PROFILE ? SQLITE_PROFILE : "postgres";
}

// 데코레이터는 모듈 로드 시점에 한 번만 평가되므로 방언도 그때 굳힌다.
const driver = resolveDbDriver();

/** sqlite에는 jsonb가 없어 TypeORM이 직렬화를 대신하는 타입으로 내린다. */
export function jsonColumnType(): "jsonb" | "simple-json" {
    return driver === SQLITE_PROFILE ? "simple-json" : "jsonb";
}

/** sqlite에는 timestamptz가 없어 datetime으로 내린다. */
export function timestampColumnType(): "timestamptz" | "datetime" {
    return driver === SQLITE_PROFILE ? "datetime" : "timestamptz";
}

/** sqlite의 텍스트 컬럼은 직렬화된 문자열이어야 DDL이 서므로 기본값도 방언을 따른다. */
export function jsonColumnDefault(value: object): object | string {
    return driver === SQLITE_PROFILE ? JSON.stringify(value) : value;
}
