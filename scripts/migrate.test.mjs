import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DATA_SOURCES, migrationRun } from "./migrate.mjs";

describe("마이그레이션 러너", () => {
  it("조회 모델을 먼저 실행하고 원장을 뒤에 실행한다", () => {
    assert.deepEqual(DATA_SOURCES.map((source) => source.name), ["tracer", "event"]);
  });

  it("데이터 소스마다 typeorm CLI의 migration:run을 세운다", () => {
    const { args } = migrationRun(DATA_SOURCES[0], "/app");
    assert.deepEqual(args, [
      "/app/node_modules/typeorm/cli.js",
      "migration:run",
      "-d",
      "/app/libs/tracer-model/src/persistence/tracer.datasource.ts",
    ]);
  });

  it("데이터 소스가 속한 tsconfig로 소스 실행 환경을 세운다", () => {
    const { env } = migrationRun(DATA_SOURCES[1], "/app");
    assert.equal(env.SWC_NODE_PROJECT, "/app/services/ingest-api/tsconfig.json");
    assert.match(env.NODE_OPTIONS, /@swc-node\/register/);
  });
});
