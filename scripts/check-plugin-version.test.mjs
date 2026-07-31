import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkPluginVersion } from "./check-plugin-version.mjs";

const manifest = (version) => ({ label: "plugin/.claude-plugin/plugin.json", version, canonical: true });
const workspace = (version) => ({ label: "plugin/package.json", version, canonical: false });
const marketplace = (version) => ({ label: ".claude-plugin/marketplace.json", version, canonical: false });

describe("플러그인 버전 검사기", () => {
  it("두 선언이 같은 정식 버전이면 통과시킨다", () => {
    assert.deepEqual(checkPluginVersion([manifest("0.8.14"), workspace("0.8.14")]), []);
  });

  it("두 선언의 버전이 다르면 거부한다", () => {
    const errors = checkPluginVersion([manifest("0.8.14"), workspace("0.7.0")]);
    assert.ok(errors.some((error) => error.includes("버전이 다르다")));
  });

  it("자리를 채우지 않은 버전을 거부한다", () => {
    const errors = checkPluginVersion([manifest("0.8"), workspace("0.8")]);
    assert.ok(errors.some((error) => error.includes("X.Y.Z가 아니다")));
  });

  it("접두사 v가 붙은 버전을 거부한다", () => {
    const errors = checkPluginVersion([manifest("v0.8.14"), workspace("v0.8.14")]);
    assert.ok(errors.some((error) => error.includes("X.Y.Z가 아니다")));
  });

  it("사전 배포 식별자가 붙은 버전을 거부한다", () => {
    const errors = checkPluginVersion([manifest("0.8.14-beta"), workspace("0.8.14-beta")]);
    assert.ok(errors.some((error) => error.includes("X.Y.Z가 아니다")));
  });

  it("기대 버전과 정본이 같으면 통과시킨다", () => {
    assert.deepEqual(checkPluginVersion([manifest("0.8.14"), workspace("0.8.14")], "0.8.14"), []);
  });

  it("기대 버전과 정본이 다르면 거부한다", () => {
    const errors = checkPluginVersion([manifest("0.8.14"), workspace("0.8.14")], "0.8.15");
    assert.ok(errors.some((error) => error.includes("기대 버전과")));
  });

  it("설치 목록의 버전이 뒤처지면 거부한다", () => {
    const errors = checkPluginVersion([manifest("0.8.15"), workspace("0.8.15"), marketplace("0.8.14")]);
    assert.ok(errors.some((error) => error.includes("버전이 다르다")));
  });

  it("세 선언이 같으면 통과시킨다", () => {
    assert.deepEqual(checkPluginVersion([manifest("0.8.15"), workspace("0.8.15"), marketplace("0.8.15")]), []);
  });
});
