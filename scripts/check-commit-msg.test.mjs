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

  it("표에 없던 활용형도 거부한다", () => {
    for (const [subject, hint] of [
      ["refactor(repo): 조사가 무너진 자리를 고친다", "실패한다"],
      ["refactor(repo): 조율자가 근거를 캐지 않게 한다", "수집한다"],
      ["test(repo): 스캔이 훑은 태스크 수를 고정한다", "조회한다"],
      ["fix(repo): 값을 견주는 절차를 고친다", "비교한다"],
      ["refactor(repo): 실패 강등을 노드가 소유한다", "낮춘다"],
    ]) {
      const errors = checkCommitMessage(subject);
      assert.ok(
        errors.some((error) => error.includes(hint)),
        `${subject} 에서 ${hint} 를 알리지 않았다`,
      );
    }
  });

  it("은유가 아닌 제자리 낱말은 통과시킨다", () => {
    for (const subject of [
      "fix(repo): 끊긴 실행을 대기 자리로 되돌린다",
      "feat(repo): 연결 풀을 부른 쪽에 돌려준다",
      "fix(repo): 남의 스레드를 없는 것으로 돌려보낸다",
      "refactor(repo): 노드 이름과 실행을 한 객체에 모은다",
      "docs(repo): 핵심은 계약이 값을 소유한다는 사실이다",
    ]) {
      assert.deepEqual(checkCommitMessage(subject), [], subject);
    }
  });

  it("어간의 받침에 맞지 않는 어미와 조사를 거부한다", () => {
    assert.ok(
      checkCommitMessage("fix(repo): 그 스레드만 조회하는다").some((error) => error.includes("어미")),
    );
    assert.ok(
      checkCommitMessage("fix(repo): 공급자의 판정만 받은다").some((error) => error.includes("어미")),
    );
    assert.ok(
      checkCommitMessage("fix(repo): 맡아 둔 알림를 켠다").some((error) =>
        error.includes("목적격 조사"),
      ),
    );
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
