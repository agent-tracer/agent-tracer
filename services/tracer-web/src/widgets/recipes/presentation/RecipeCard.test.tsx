import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { Recipe } from "~tracer-web/entities/recipe/model/recipe.js";
import { RecipeCard } from "~tracer-web/widgets/recipes/presentation/RecipeCard.js";

const TASK_ID = "task-1" as TaskId;

afterEach(() => cleanup());

function recipe(): Recipe {
  return {
    id: "recipe-1",
    sourceCandidateId: null,
    sourceJobId: null,
    title: "인증 실패를 추적한다",
    intent: "인증 실패 해결",
    description: "요청과 수행 흐름과 마찰을 함께 보존한다.",
    useWhen: ["로그인이 401로 실패할 때"],
    summaryMd: "- 이벤트를 확인한다",
    request: "사용자는 로그인 실패 원인을 찾아 고쳐달라고 했다.",
    inputs: ["실패한 로그인 요청의 이벤트"],
    outputs: ["쿠키 설정이 붙은 인증 경로"],
    corrections: [
      {
        whatAgentDid: "처음에는 토큰 저장소만 수정했다.",
        howCorrected: "쿠키 설정 누락을 확인하고 수정했다.",
        evidence: ["event-1"],
      },
    ],
    pitfalls: [
      {
        pitfall: "같은 401이 여러 레이어에서 발생한다.",
        whyNonObvious: "표면 로그만 보면 API 라우터 문제처럼 보인다.",
        evidence: ["event-2"],
      },
    ],
    recovery: [
      {
        symptom: "되돌린 뒤에도 옛 쿠키가 남았다.",
        action: "쿠키를 지우고 로그인을 다시 시도했다.",
        evidence: ["event-3"],
        stepOrder: 1,
      },
    ],
    governingRules: ["rule-1"],
    steps: [
      {
        order: 1,
        action: "인증 이벤트를 확인한다",
        evidence: ["event-1"],
        verify: { kind: "command", commandMatches: ["npm test"] },
      },
    ],
    touchedFiles: [{ path: "auth.ts", role: "read", why: "쿠키 설정의 정본이다", loadWhen: "401을 볼 때" }],
    contributingSlices: [{ taskId: TASK_ID, eventIds: ["event-1"] }],
    rev: 1,
    parentRecipeId: null,
    status: "candidate",
    userEdited: false,
    lastEditedBy: "agent",
    applicationCount: 0,
    language: "ko",
    rationale: "성공 흐름이 재사용 가능하다.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("레시피 카드", () => {
  it("요청과 보정과 함정을 표시한다", () => {
    render(
      <RecipeCard
        recipe={recipe()}
        taskTitleById={new Map([[TASK_ID, "로그인 실패 수정"]])}
        footMetaAt="2026-07-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByText("Request")).toBeTruthy();
    expect(screen.getByText(/로그인 실패 원인/)).toBeTruthy();
    expect(screen.getByText("Corrections")).toBeTruthy();
    expect(screen.getByText(/토큰 저장소/)).toBeTruthy();
    expect(screen.getByText("Pitfalls")).toBeTruthy();
    expect(screen.getByText(/같은 401/)).toBeTruthy();
  });

  it("적용된 규칙과 승격 가능한 규칙 제안을 표시한다", () => {
    render(
      <RecipeCard
        recipe={recipe()}
        taskTitleById={new Map([[TASK_ID, "로그인 실패 수정"]])}
        footMetaAt="2026-07-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByText("Governing rules")).toBeTruthy();
    expect(screen.getByText("rule-1")).toBeTruthy();
  });

  it("적용 조건과 입력과 산출물과 복구를 표시한다", () => {
    render(
      <RecipeCard
        recipe={recipe()}
        taskTitleById={new Map([[TASK_ID, "로그인 실패 수정"]])}
        footMetaAt="2026-07-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByText("Use when")).toBeTruthy();
    expect(screen.getByText(/401로 실패할 때/)).toBeTruthy();
    expect(screen.getByText("Inputs")).toBeTruthy();
    expect(screen.getByText("Outputs")).toBeTruthy();
    expect(screen.getByText("Recovery")).toBeTruthy();
    expect(screen.getByText(/옛 쿠키가 남았다/)).toBeTruthy();
  });

  it("단계의 근거와 확인 신호와 참조 파일의 쓰임을 표시한다", () => {
    render(
      <RecipeCard
        recipe={recipe()}
        taskTitleById={new Map([[TASK_ID, "로그인 실패 수정"]])}
        footMetaAt="2026-07-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByText("verify: runs npm test")).toBeTruthy();
    expect(screen.getByText("쿠키 설정의 정본이다")).toBeTruthy();
    expect(screen.getByText("read when 401을 볼 때")).toBeTruthy();
  });
});
