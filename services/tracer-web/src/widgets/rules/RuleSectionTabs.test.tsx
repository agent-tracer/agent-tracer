import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RuleSectionTabs } from "~tracer-web/widgets/rules/RuleSectionTabs.js";

afterEach(cleanup);

describe("RuleSectionTabs", () => {
  it("두 탭의 수를 각각 보인다", () => {
    render(
      <RuleSectionTabs
        active="rules"
        onSelect={() => {}}
        counts={{ rules: 3, generations: 9 }}
        runningGenerations={0}
      />,
    );

    expect(screen.getByRole("button", { name: /Rules/ })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /Generations/ })).toHaveTextContent("9");
  });

  it("도는 실행이 있으면 규칙 탭에 있어도 알린다", () => {
    render(
      <RuleSectionTabs
        active="rules"
        onSelect={() => {}}
        counts={{ rules: 0, generations: 2 }}
        runningGenerations={1}
      />,
    );

    expect(screen.getByLabelText("1건 실행 중")).toBeInTheDocument();
  });

  it("실행이 없으면 알림 점을 두지 않는다", () => {
    render(
      <RuleSectionTabs
        active="generations"
        onSelect={() => {}}
        counts={{ rules: 0, generations: 2 }}
        runningGenerations={0}
      />,
    );

    expect(screen.queryByLabelText(/실행 중/)).not.toBeInTheDocument();
  });

  it("탭을 고르면 그 탭을 알린다", () => {
    const onSelect = vi.fn();
    render(
      <RuleSectionTabs
        active="rules"
        onSelect={onSelect}
        counts={{ rules: 1, generations: 1 }}
        runningGenerations={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Generations/ }));

    expect(onSelect).toHaveBeenCalledWith("generations");
  });
});
