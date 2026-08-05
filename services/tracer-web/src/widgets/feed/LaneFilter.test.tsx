import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createUiStore, UiStoreProvider } from "~tracer-web/shared/store/index.js";
import { ALL_VISIBLE_LANES } from "~tracer-web/shared/store/slices/viewSlice.js";
import { TooltipProvider } from "~tracer-web/shared/ui/index.js";
import { LaneFilter } from "~tracer-web/widgets/feed/LaneFilter.js";

afterEach(cleanup);

describe("LaneFilter", () => {
  it("None을 누르면 모든 레인을 숨긴다", () => {
    const store = renderFilter();

    fireEvent.click(screen.getByRole("button", { name: "None" }));

    expect(store.getState().visibleLanes).toEqual([]);
    for (const lane of ALL_VISIBLE_LANES) {
      expect(laneButton(lane).getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("모두 숨긴 뒤에는 All로 되돌린다", () => {
    const store = renderFilter();

    fireEvent.click(screen.getByRole("button", { name: "None" }));
    const none = screen.getByRole("button", { name: "None" });
    expect(none.hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(store.getState().visibleLanes).toEqual(ALL_VISIBLE_LANES);
    expect(screen.getByRole("button", { name: "None" }).hasAttribute("disabled")).toBe(false);
  });

  it("마지막 하나 남은 레인도 개별 토글로 끌 수 있다", () => {
    const store = createUiStore({ persisted: false });
    store.getState().setVisibleLanes(["impl"]);
    renderFilter(store);

    fireEvent.click(laneButton("impl"));

    expect(store.getState().visibleLanes).toEqual([]);
  });
});

function renderFilter(store = createUiStore({ persisted: false })) {
  render(
    <TooltipProvider>
      <UiStoreProvider store={store}>
        <LaneFilter />
      </UiStoreProvider>
    </TooltipProvider>,
  );

  return store;
}

function laneButton(lane: string) {
  return screen.getByRole("button", { name: lane.toUpperCase() });
}
