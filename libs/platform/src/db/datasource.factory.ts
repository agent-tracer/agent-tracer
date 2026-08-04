import "reflect-metadata";
import { DataSource, type EntitySchema, type MixedList } from "typeorm";
import type { DbConfig } from "../config/application.config.schema.js";

type Ctor = new (...args: never[]) => object;

export interface DataSourceParams {
    readonly db: DbConfig;
    readonly entities: MixedList<Ctor | string | EntitySchema>;
    readonly migrations: MixedList<Ctor | string>;
    readonly migrationsRun?: boolean;
}

// 로컬 파일 하나를 여러 프로세스가 함께 여므로 WAL로 읽기와 쓰기를 겹치게 한다.
const SQLITE_BUSY_TIMEOUT_MS = 5000;

function prepareSqlite(database: { pragma(source: string): unknown }): void {
    database.pragma("journal_mode = WAL");
    database.pragma(`busy_timeout = ${SQLITE_BUSY_TIMEOUT_MS}`);
}

export function createDataSource(params: DataSourceParams): DataSource {
    const common = {
        entities: params.entities,
        migrations: params.migrations,
        migrationsRun: params.migrationsRun ?? false,
        logging: false as const,
    };
    // sqlite 프로파일은 파티션과 CDC가 없어 마이그레이션 대신 엔티티 선언에서 스키마를 세운다.
    if (params.db.driver === "sqlite") {
        return new DataSource({
            type: "better-sqlite3",
            database: params.db.file,
            prepareDatabase: prepareSqlite,
            synchronize: true,
            ...common,
        });
    }
    return new DataSource({
        type: "postgres",
        host: params.db.host,
        port: params.db.port,
        username: params.db.username,
        password: params.db.password,
        database: params.db.database,
        synchronize: false,
        ...common,
    });
}
