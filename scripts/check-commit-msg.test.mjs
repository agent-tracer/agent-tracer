import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkCommitMessage } from "./check-commit-msg.mjs";

describe("커밋 메시지 검사기", () => {
  it("타입과 범위와 행위 문장을 갖춘 제목을 통과시킨다", () => {
    assert.deepEqual(checkCommitMessage("feat(kernel): 조회 창구를 세운다"), []);
  });

  it("명사구 제목을 거부한다", () => {
    const errors = checkCommitMessage("feat(kernel): 조회 창구");
    assert.ok(errors.some((error) => error.includes("행위 문장")));
  });

  it("허용 목록에 없는 범위를 거부한다", () => {
    const errors = checkCommitMessage("feat(nowhere): 창구를 세운다");
    assert.ok(errors.some((error) => error.includes("범위")));
  });

  it("저장소가 만들어진 경위를 가리키는 어휘를 거부한다", () => {
    const errors = checkCommitMessage("feat(kernel): 기존 창구를 세운다");
    assert.ok(errors.some((error) => error.includes("기존")));
  });

  it("은유와 구어를 거부하고 대신 쓸 동사를 알린다", () => {
    const errors = checkCommitMessage("refactor(kernel): 중계 경로를 걷어낸다");
    assert.ok(errors.some((error) => error.includes("제거한다")));
  });

  it("본문의 정형 블록을 거부한다", () => {
    const errors = checkCommitMessage("feat(kernel): 조회 창구를 세운다\n\nRelated: 무언가");
    assert.ok(errors.some((error) => error.includes("정형 블록")));
  });
});

describe("플러그인 릴리스 커밋", () => {
  it("버전 하나만 갖는 제목을 통과시킨다", () => {
    assert.deepEqual(checkCommitMessage("[RELEASE] 0.8.14"), []);
  });

  it("자리를 채우지 않은 버전을 거부한다", () => {
    const errors = checkCommitMessage("[RELEASE] 0.8");
    assert.ok(errors.some((error) => error.includes("[RELEASE] X.Y.Z")));
  });

  it("접두사 v가 붙은 버전을 거부한다", () => {
    const errors = checkCommitMessage("[RELEASE] v0.8.14");
    assert.ok(errors.some((error) => error.includes("[RELEASE] X.Y.Z")));
  });

  it("사전 배포 식별자가 붙은 버전을 거부한다", () => {
    const errors = checkCommitMessage("[RELEASE] 0.8.14-beta");
    assert.ok(errors.some((error) => error.includes("[RELEASE] X.Y.Z")));
  });

  it("본문이 있는 릴리스 커밋을 거부한다", () => {
    const errors = checkCommitMessage("[RELEASE] 0.8.14\n\n버전을 올린다");
    assert.ok(errors.some((error) => error.includes("본문은 비어 있어야 한다")));
  });

  it("공동 작성자 트레일러만 있는 본문은 비어 있는 것으로 본다", () => {
    assert.deepEqual(checkCommitMessage("[RELEASE] 0.8.14\n\nCo-authored-by: 누군가 <a@b.c>"), []);
  });

  it("일반 커밋의 규칙을 그대로 남긴다", () => {
    assert.deepEqual(checkCommitMessage("feat(plugin): 설치 산출물을 조립한다"), []);
    assert.ok(checkCommitMessage("feat(plugin): 조회 창구").length > 0);
  });
});
