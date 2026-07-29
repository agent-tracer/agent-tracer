#!/usr/bin/env node
// 두 원장의 마이그레이션을 차례로 실행하고 하나라도 실패하면 그 자리에서 멈춘다.

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPEORM_CLI = "node_modules/typeorm/cli.js";

/** 마이그레이션을 소유한 데이터 소스이며 적힌 차례대로 실행한다. */
export const DATA_SOURCES = Object.freeze([
  Object.freeze({
    name: "tracer",
    project: "libs/tracer-model/tsconfig.json",
    dataSource: "libs/tracer-model/src/persistence/tracer.datasource.ts",
  }),
  Object.freeze({
    name: "event",
    project: "services/ingest-api/tsconfig.json",
    dataSource: "services/ingest-api/src/event.datasource.ts",
  }),
]);

/** 데이터 소스 하나를 실행할 자식 프로세스의 인자와 환경을 만든다. */
export function migrationRun(source, root) {
  return {
    args: [
      path.join(root, TYPEORM_CLI),
      "migration:run",
      "-d",
      path.join(root, source.dataSource),
    ],
    env: {
      NODE_OPTIONS: "--import @swc-node/register/esm-register",
      SWC_NODE_PROJECT: path.join(root, source.project),
    },
  };
}

function main() {
  for (const source of DATA_SOURCES) {
    const { args, env } = migrationRun(source, ROOT);
    console.log(`migrate: ${source.name}`);
    const result = spawnSync(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    if (result.status !== 0) {
      console.error(`migrate: ${source.name} 실패`);
      process.exit(result.status ?? 1);
    }
  }
  console.log(`migrate: ${DATA_SOURCES.length}개 데이터 소스 완료`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
