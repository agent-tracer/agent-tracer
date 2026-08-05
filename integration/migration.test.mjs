// 이행은 실행 중인 데이터베이스에만 결과를 남기므로 빈 Postgres를 세워 실제로 실행하고 남은 스키마를 확인한다.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import { DATA_SOURCES, migrationRun } from "../scripts/migrate.mjs";
import { DATABASES, migrationEnv, startEventDb, startTracerDb } from "./support/postgres.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** 원장이 세워야 하는 표이며 events는 pg_partman이 나누는 뿌리다. */
const EVENT_TABLES = ["events", "event_ingest_keys"];

/** 조회 모델이 세워야 하는 표 가운데 투영이 직접 쓰는 것들이다. */
const TRACER_TABLES = ["tasks", "events", "turns", "sessions", "rules", "search_outbox"];

let eventDb;
let tracerDb;
let env;

/** 컨테이너 안의 psql로 질의해 첫 칸을 읽는다. */
async function query(container, database, sql) {
    const result = await container.exec(["psql", "-U", "root", "-d", database, "-tAc", sql]);
    assert.equal(result.exitCode, 0, `psql 실패: ${result.output}`);
    return result.output.trim();
}

/** 데이터베이스에 있는 표 이름을 모두 읽는다. */
async function tablesOf(container, database) {
    const listed = await query(
        container,
        database,
        "select tablename from pg_tables where schemaname = 'public'",
    );
    return listed.split("\n").map((name) => name.trim()).filter(Boolean);
}

/** 이행 하나를 실제로 실행하고 종료 코드를 낸다. */
function runMigration(source) {
    const { args, env: sourceEnv } = migrationRun(source, ROOT);
    return spawnSync(process.execPath, args, {
        cwd: ROOT,
        env: { ...process.env, ...env, ...sourceEnv },
        encoding: "utf8",
    });
}

describe("스키마 이행", () => {
    before(async () => {
        [eventDb, tracerDb] = await Promise.all([startEventDb(), startTracerDb()]);
        env = migrationEnv(eventDb, tracerDb);
    });

    after(async () => {
        await Promise.all([eventDb?.stop(), tracerDb?.stop()]);
    });

    it("빈 데이터베이스에 두 원장의 이행이 모두 성공한다", () => {
        for (const source of DATA_SOURCES) {
            const result = runMigration(source);
            assert.equal(result.status, 0, `${source.name} 이행 실패: ${result.stderr}`);
        }
    });

    it("원장이 이벤트 표와 인제스트 키 표를 세운다", async () => {
        const tables = await tablesOf(eventDb, DATABASES.event);

        for (const table of EVENT_TABLES) assert.ok(tables.includes(table), `${table}이 없다`);
    });

    it("원장이 변경 데이터 캡처가 읽는 발행을 세운다", async () => {
        const publication = await query(
            eventDb,
            DATABASES.event,
            "select pubname from pg_publication where pubname = 'dbz_runtime'",
        );

        assert.equal(publication, "dbz_runtime");
    });

    it("조회 모델이 투영이 쓰는 표를 세운다", async () => {
        const tables = await tablesOf(tracerDb, DATABASES.tracer);

        for (const table of TRACER_TABLES) assert.ok(tables.includes(table), `${table}이 없다`);
    });

    it("이행을 다시 실행해도 같은 스키마에 머문다", async () => {
        const before = await tablesOf(tracerDb, DATABASES.tracer);

        for (const source of DATA_SOURCES) {
            assert.equal(runMigration(source).status, 0, `${source.name} 재실행 실패`);
        }

        assert.deepEqual(await tablesOf(tracerDb, DATABASES.tracer), before);
    });
});
