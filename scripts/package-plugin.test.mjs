import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findMissingHookCommands } from "./package-plugin.mjs";

const manifest = {
  statusLine: { type: "command", command: "${CLAUDE_PLUGIN_ROOT}/bin/run-hook-claude.sh StatusLine" },
  hooks: {
    SessionStart: [
      { hooks: [{ type: "command", command: "${CLAUDE_PLUGIN_ROOT}/bin/run-hook-claude.sh SessionStart" }] },
    ],
    Stop: [{ hooks: [{ type: "command", command: "${CLAUDE_PLUGIN_ROOT}/bin/run-hook-stop.sh" }] }],
  },
};

describe("훅 대상 검사", () => {
  it("모든 대상이 산출물에 있으면 빈 목록을 낸다", () => {
    assert.deepEqual(findMissingHookCommands(manifest, () => true), []);
  });

  it("중첩된 선언에서도 빠진 대상을 찾아낸다", () => {
    const missing = findMissingHookCommands(manifest, (target) => target !== "bin/run-hook-stop.sh");
    assert.deepEqual(missing, ["bin/run-hook-stop.sh"]);
  });

  it("인자를 뺀 실행 파일 경로만 대상으로 삼는다", () => {
    const seen = [];
    findMissingHookCommands(manifest, (target) => {
      seen.push(target);
      return true;
    });
    assert.deepEqual(seen.sort(), ["bin/run-hook-claude.sh", "bin/run-hook-stop.sh"]);
  });
});
