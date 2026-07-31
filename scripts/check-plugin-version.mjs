#!/usr/bin/env node
// 플러그인 버전 정본과 workspace 선언이 같은 값인지 검사한다.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// 릴리스 버전의 정본은 설치본이 읽는 매니페스트이고 나머지 둘이 그것을 따른다.
const SOURCES = Object.freeze([
  { file: "plugin/.claude-plugin/plugin.json", at: ["version"], canonical: true },
  { file: "plugin/package.json", at: ["version"], canonical: false },
  { file: ".claude-plugin/marketplace.json", at: ["metadata", "version"], canonical: false },
]);

function readVersion({ file, at }) {
  const parsed = JSON.parse(fs.readFileSync(path.join(repoRoot, file), "utf8"));
  const value = at.reduce((node, key) => (node === undefined || node === null ? undefined : node[key]), parsed);
  return typeof value === "string" ? value : "";
}

/** 두 선언과 기대값을 대조해 위반 목록을 낸다. */
export function checkPluginVersion(versions, expected) {
  const errors = [];

  for (const { label, version } of versions) {
    if (!SEMVER_PATTERN.test(version)) {
      errors.push(`${label}의 버전이 X.Y.Z가 아니다: "${version}"`);
    }
  }

  const distinct = new Set(versions.map(({ version }) => version));
  if (distinct.size > 1) {
    errors.push(`두 선언의 버전이 다르다: ${versions.map(({ label, version }) => `${label}=${version}`).join(", ")}`);
  }

  if (expected !== undefined) {
    if (!SEMVER_PATTERN.test(expected)) {
      errors.push(`기대 버전이 X.Y.Z가 아니다: "${expected}"`);
    }
    const canonical = versions.find(({ canonical: isCanonical }) => isCanonical);
    if (canonical !== undefined && canonical.version !== expected) {
      errors.push(`기대 버전과 ${canonical.label}이 다르다: 기대=${expected}, 선언=${canonical.version}`);
    }
  }

  return errors;
}

function parseExpected(argv) {
  const index = argv.indexOf("--expected");
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (value === undefined) {
    console.error("사용: node scripts/check-plugin-version.mjs [--expected X.Y.Z]");
    process.exit(2);
  }
  return value;
}

function main() {
  const versions = SOURCES.map((source) => ({ ...source, label: source.file, version: readVersion(source) }));
  const errors = checkPluginVersion(versions, parseExpected(process.argv.slice(2)));

  for (const { label, version } of versions) {
    console.log(`  ${label}: ${version || "(선언 없음)"}`);
  }

  if (errors.length > 0) {
    console.error("\n플러그인 버전이 어긋난다.\n");
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
