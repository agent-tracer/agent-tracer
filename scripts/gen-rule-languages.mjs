#!/usr/bin/env node
// 규칙 생성이 받는 언어 목록은 계약이 갖는 값이라 계약에서 생성해 커밋하고 CI가 신선도를 본다.
//
// 사용:
//   node scripts/gen-rule-languages.mjs            생성
//   node scripts/gen-rule-languages.mjs --check    커밋된 파일이 계약과 일치하는지 검사

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "contract", "agent", "shared", "languages.json");
const TARGET = path.join(ROOT, "libs", "kernel", "src", "rule", "generation", "rule.generation.languages.ts");

/** 계약이 적은 언어 목록과 기본값을 읽는다. */
export function readContractLanguages(text) {
  const declared = JSON.parse(text);
  if (!Array.isArray(declared.languages) || declared.languages.length === 0) {
    throw new Error("계약이 언어 목록을 갖지 않는다");
  }
  if (!declared.languages.includes(declared.default)) {
    throw new Error(`계약의 기본 언어 ${declared.default} 가 목록에 없다`);
  }
  return { languages: declared.languages, fallback: declared.default };
}

/** 계약의 목록에서 커널이 쓸 선언을 만든다. */
export function buildModule({ languages, fallback }) {
  const entries = languages.map((name) => `    ${name}: "${name}",`).join("\n");
  const listed = languages.map((name) => `    RULE_GENERATION_LANGUAGE.${name},`).join("\n");
  return [
    "// contract/agent/shared/languages.json 에서 만든 파일이라 손으로 고치지 않는다.",
    "",
    "/** 규칙 이름과 근거를 쓸 언어이며 값은 계약이 갖는다. */",
    "export const RULE_GENERATION_LANGUAGE = {",
    entries,
    "} as const;",
    "",
    "export type RuleGenerationLanguage = (typeof RULE_GENERATION_LANGUAGE)[keyof typeof RULE_GENERATION_LANGUAGE];",
    "",
    "export const RULE_GENERATION_LANGUAGES: readonly RuleGenerationLanguage[] = [",
    listed,
    "];",
    "",
    "/** 고르지 않았거나 계약이 모르는 값일 때 쓰는 언어다. */",
    `export const RULE_GENERATION_LANGUAGE_FALLBACK: RuleGenerationLanguage = RULE_GENERATION_LANGUAGE.${fallback};`,
    "",
  ].join("\n");
}

function main() {
  const generated = buildModule(readContractLanguages(fs.readFileSync(SOURCE, "utf8")));
  if (process.argv.includes("--check")) {
    const committed = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8") : "";
    if (committed !== generated) {
      console.error("규칙 생성 언어 목록이 계약과 어긋난다. npm run gen:rule-languages 를 실행한다.");
      process.exit(1);
    }
    console.log("gen:rule-languages 최신");
    return;
  }
  fs.writeFileSync(TARGET, generated);
  console.log(`gen:rule-languages -> ${path.relative(ROOT, TARGET)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
