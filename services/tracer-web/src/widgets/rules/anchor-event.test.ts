import { describe, expect, it } from "vitest";
import { resolveAnchorEventId } from "~tracer-web/widgets/rules/anchor-event.js";

describe("resolveAnchorEventId", () => {
  const inputs = [{ eventId: "evt-1" }, { eventId: "evt-2" }, { eventId: "evt-3" }];

  it("고르지 않았으면 마지막 발화를 앵커로 둔다", () => {
    expect(resolveAnchorEventId("", inputs)).toBe("evt-3");
  });

  it("목록이 다시 와도 고른 앵커를 그대로 둔다", () => {
    expect(resolveAnchorEventId("evt-1", inputs)).toBe("evt-1");
    expect(resolveAnchorEventId("evt-1", [...inputs, { eventId: "evt-4" }])).toBe("evt-1");
  });

  it("고른 앵커가 목록에서 사라지면 마지막 발화로 되돌린다", () => {
    expect(resolveAnchorEventId("evt-9", inputs)).toBe("evt-3");
  });

  it("발화가 하나도 없으면 앵커가 없다", () => {
    expect(resolveAnchorEventId("evt-1", [])).toBe("");
    expect(resolveAnchorEventId("", [])).toBe("");
  });
});
