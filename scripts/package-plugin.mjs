#!/usr/bin/env node
// 빌드된 플러그인을 설치 산출물 한 벌로 조립한다.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = path.join(repoRoot, "plugin");
const stagingRoot = path.join(repoRoot, "build/plugin");

// 여기 나열한 것만 산출물에 담긴다.
const CONTENTS = Object.freeze([
  ".claude-plugin/plugin.json",
  "bin/run-hook-claude.sh",
  "bin/run-mcp-server.sh",
  "commands",
  "hooks/hooks.json",
  "dist",
]);

// 하나라도 없으면 설치본이 훅도 서버도 실행하지 못한다.
const REQUIRED_ENTRYPOINTS = Object.freeze([
  "dist/daemon/main.js",
  "dist/agent/claude-code/mcp/server.js",
]);

const HOOK_BUNDLE_DIR = "dist/agent/claude-code/hooks";
const PLUGIN_ROOT_PLACEHOLDER = "${CLAUDE_PLUGIN_ROOT}/";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** hooks.json이 부르는 command 대상 가운데 산출물에 없는 것을 찾는다. */
export function findMissingHookCommands(hooksManifest, exists) {
  const commands = new Set();

  const collect = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) collect(item);
      return;
    }
    if (node === null || typeof node !== "object") return;
    if (typeof node.command === "string" && node.command.startsWith(PLUGIN_ROOT_PLACEHOLDER)) {
      commands.add(node.command.slice(PLUGIN_ROOT_PLACEHOLDER.length).split(" ")[0]);
    }
    for (const value of Object.values(node)) collect(value);
  };

  collect(hooksManifest);
  return [...commands].filter((target) => !exists(target)).sort();
}

function copyInto(source, destination) {
  fs.cpSync(source, destination, { recursive: true, preserveTimestamps: true });
}

function fail(message, details = []) {
  console.error(`플러그인 산출물을 조립하지 못한다: ${message}\n`);
  for (const detail of details) console.error(`  ✗ ${detail}`);
  process.exit(1);
}

function checkVersion(expected) {
  const args = ["scripts/check-plugin-version.mjs", ...(expected === undefined ? [] : ["--expected", expected])];
  const result = spawnSync(process.execPath, args, { cwd: repoRoot, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function parseExpected(argv) {
  const index = argv.indexOf("--expected");
  return index === -1 ? undefined : argv[index + 1];
}

function main() {
  const expected = parseExpected(process.argv.slice(2));
  checkVersion(expected);

  const version = readJson(path.join(pluginRoot, ".claude-plugin/plugin.json")).version;
  const packageName = `agent-tracer-plugin-v${version}`;
  const packageRoot = path.join(stagingRoot, packageName);

  const missingSources = CONTENTS.filter((entry) => !fs.existsSync(path.join(pluginRoot, entry)));
  if (missingSources.length > 0) {
    fail("빌드 산출물이 없다. plugin build를 먼저 실행한다.", missingSources);
  }

  const missingEntrypoints = REQUIRED_ENTRYPOINTS.filter((entry) => !fs.existsSync(path.join(pluginRoot, entry)));
  if (missingEntrypoints.length > 0) {
    fail("필수 진입점이 없다.", missingEntrypoints);
  }

  const hookBundles = fs
    .readdirSync(path.join(pluginRoot, HOOK_BUNDLE_DIR))
    .filter((entry) => entry.endsWith(".js"));
  if (hookBundles.length === 0) {
    fail("훅 번들이 하나도 없다.", [HOOK_BUNDLE_DIR]);
  }

  fs.rmSync(stagingRoot, { recursive: true, force: true });
  fs.mkdirSync(packageRoot, { recursive: true });

  for (const entry of CONTENTS) {
    const destination = path.join(packageRoot, entry);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    copyInto(path.join(pluginRoot, entry), destination);
  }

  const hooksManifest = readJson(path.join(packageRoot, "hooks/hooks.json"));
  const missingCommands = findMissingHookCommands(hooksManifest, (target) =>
    fs.existsSync(path.join(packageRoot, target)),
  );
  if (missingCommands.length > 0) {
    fail("hooks.json이 부르는 대상이 산출물에 없다.", missingCommands);
  }

  console.log(`  버전: ${version}`);
  console.log(`  훅 번들: ${hookBundles.length}개`);
  console.log(packageRoot);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
