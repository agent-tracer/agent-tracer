import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createUiStore, UiStoreProvider } from "~tracer-web/shared/store/index.js";
import { LlmProviderSection } from "~tracer-web/widgets/settings/llm-provider/LlmProviderSection.js";

const settingsQuery: { data?: unknown; isLoading: boolean; error?: unknown } = {
  data: { settings: [] },
  isLoading: false,
};

vi.mock("~tracer-web/entities/setting/api/queries.js", () => ({
  useAppSettingsQuery: () => settingsQuery,
  useModelOptionsQuery: () => ({
    data: [{ id: "claude-haiku-4-5", label: "Claude Haiku 4.5" }],
  }),
}));

vi.mock("~tracer-web/entities/setting/api/mutations.js", () => ({
  usePutAppSettingMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useDeleteAppSettingMutation: () => ({
    mutateAsync: vi.fn(),
  }),
}));

describe("규칙 생성 설정", () => {
  afterEach(() => {
    cleanup();
    settingsQuery.data = { settings: [] };
    settingsQuery.isLoading = false;
    delete settingsQuery.error;
  });

  it("AI 출력 언어와 브라우저 설명 언어의 범위를 분리해 안내한다", () => {
    const store = createUiStore({ persisted: false });
    const { container } = render(
      <UiStoreProvider store={store}>
        <LlmProviderSection />
      </UiStoreProvider>,
    );

    expect(container.textContent).toContain(
      "title suggestions, recipe scans, and cleanup suggestions",
    );

    act(() => store.getState().setGuidanceLocale("ko"));

    expect(container.textContent).toContain(
      "제목 제안과 레시피 스캔과 정리 제안이 낼 결과의 언어입니다",
    );
    expect(screen.getByText("Output language").textContent).toBe(
      "Output language",
    );
    expect(container.querySelectorAll('[lang="ko"]').length).toBeGreaterThan(0);
  });

  it("고를 수 있는 모델을 서버 카탈로그에서 받아 채운다", () => {
    const store = createUiStore({ persisted: false });
    render(
      <UiStoreProvider store={store}>
        <LlmProviderSection />
      </UiStoreProvider>,
    );

    expect(screen.getByRole("option", { name: "Claude Haiku 4.5" })).toBeDefined();
  });

  it("설정 창구가 없는 배포에서는 아무것도 그리지 않는다", () => {
    const missingSurface = Object.assign(new Error("not implemented"), { status: 501 });
    settingsQuery.data = undefined;
    settingsQuery.error = missingSurface;
    const store = createUiStore({ persisted: false });

    const { container } = render(
      <UiStoreProvider store={store}>
        <LlmProviderSection />
      </UiStoreProvider>,
    );

    expect(container.innerHTML).toBe("");
  });
});
