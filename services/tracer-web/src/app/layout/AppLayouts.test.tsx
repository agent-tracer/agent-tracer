import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CompactAppLayout } from "~tracer-web/app/layout/CompactAppLayout.js";
import { WideAppLayout } from "~tracer-web/app/layout/WideAppLayout.js";

vi.mock("~tracer-web/widgets/topbar/index.js", () => ({
  TopBar: ({ viewport }: { readonly viewport: string }) => <div>Top {viewport}</div>,
}));
vi.mock("~tracer-web/widgets/task-list/index.js", () => ({
  TaskListPanel: () => <div>Task list</div>,
}));
vi.mock("~tracer-web/widgets/inspector/index.js", () => ({
  InspectorPanel: () => <div>Inspector panel</div>,
}));
vi.mock("./ResizeHandle.js", () => ({
  ResizeHandle: () => <div>Resize</div>,
}));
vi.mock("./PanelRail.js", () => ({
  CollapsedPanelRail: ({ onAction }: { readonly onAction: () => void }) => <button onClick={onAction}>Collapsed rail</button>,
  CollapsePanelTab: ({ onAction }: { readonly onAction: () => void }) => <button onClick={onAction}>Collapse tab</button>,
}));

describe("뷰포트별 앱 레이아웃", () => {
  it("넓은 화면은 태스크 목록을 유지하고 선택 전 검사기를 숨긴다", () => {
    render(
      <MemoryRouter>
        <WideAppLayout
          wsConnected={false}
          inspectorAvailable={false}
          sidebarWidth={280}
          inspectorWidth={360}
          sidebarCollapsed={false}
          inspectorCollapsed={false}
          onSidebarWidthChange={vi.fn()}
          onInspectorWidthChange={vi.fn()}
          onSidebarCollapsedChange={vi.fn()}
          onInspectorCollapsedChange={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Top wide")).toBeInTheDocument();
    expect(screen.getByText("Task list")).toBeInTheDocument();
    expect(screen.queryByText("Inspector panel")).not.toBeInTheDocument();
  });

  it("모바일 화면은 태스크와 검사기를 각각 시트로 연다", () => {
    render(
      <MemoryRouter>
        <CompactAppLayout
          viewport="mobile"
          wsConnected
          inspectorAvailable
          sidebarWidth={280}
          inspectorWidth={360}
          sidebarDrawerOpen
          inspectorDrawerOpen
          sidebarCollapsed={false}
          onSidebarWidthChange={vi.fn()}
          onSidebarCollapsedChange={vi.fn()}
          onSidebarDrawerOpenChange={vi.fn()}
          onInspectorDrawerOpenChange={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("dialog", { name: "Task list" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Inspector" })).toBeInTheDocument();
  });

  it("좁은 화면에서도 태스크 목록을 완전히 접고 복원한다", () => {
    const onSidebarCollapsedChange = vi.fn();
    const props = {
      viewport: "narrow" as const,
      wsConnected: false,
      inspectorAvailable: false,
      sidebarWidth: 280,
      inspectorWidth: 360,
      sidebarDrawerOpen: false,
      inspectorDrawerOpen: false,
      onSidebarWidthChange: vi.fn(),
      onSidebarDrawerOpenChange: vi.fn(),
      onInspectorDrawerOpenChange: vi.fn(),
      onSidebarCollapsedChange,
    };
    const { container, rerender } = render(<MemoryRouter><CompactAppLayout {...props} sidebarCollapsed={false} /></MemoryRouter>);

    fireEvent.click(within(container).getByRole("button", { name: "Collapse tab" }));
    expect(onSidebarCollapsedChange).toHaveBeenCalledWith(true);

    rerender(<MemoryRouter><CompactAppLayout {...props} sidebarCollapsed /></MemoryRouter>);
    fireEvent.click(within(container).getByRole("button", { name: "Collapsed rail" }));
    expect(onSidebarCollapsedChange).toHaveBeenCalledWith(false);
  });
});
