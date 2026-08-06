import {describe, expect, it} from "vitest";
import {MARK_BOUNDARY_TOOL, parseMarkBoundaryArgs} from "./mark.boundary.tool.model.js";
import {boundaryLoggedEvent} from "./boundary.event.model.js";

describe("parseMarkBoundaryArgs", () => {
    it("라벨만 있으면 복귀가 아닌 경계로 읽는다", () => {
        expect(parseMarkBoundaryArgs({label: "로그인 버그"})).toEqual({label: "로그인 버그", back: false});
    });

    it("back이 참이면 복귀 경계다", () => {
        expect(parseMarkBoundaryArgs({label: "원래 작업", back: true})).toEqual({
            label: "원래 작업",
            back: true,
        });
    });

    it("빈 라벨과 라벨 없는 인자는 거절한다", () => {
        expect(parseMarkBoundaryArgs({label: "  "})).toBeNull();
        expect(parseMarkBoundaryArgs({})).toBeNull();
        expect(parseMarkBoundaryArgs(null)).toBeNull();
    });

    it("도구가 세션을 스스로 찾으므로 id를 받지 않는다", () => {
        expect(Object.keys(MARK_BOUNDARY_TOOL.inputSchema.properties)).toEqual(["label", "back"]);
    });
});

describe("boundaryLoggedEvent", () => {
    const target = {taskId: "t1", sessionId: "s1", turnId: "turn-1"};

    it("현재 턴에 붙는 관측 이벤트를 만든다", () => {
        const event = boundaryLoggedEvent(target, {label: "로그인 버그", back: false});

        expect(event.kind).toBe("agent_tracer.boundary.logged");
        expect(event.taskId).toBe("t1");
        expect(event.turnId).toBe("turn-1");
    });

    it("복귀 경계는 제목에서 방향이 드러난다", () => {
        const forward = boundaryLoggedEvent(target, {label: "딴 일", back: false});
        const back = boundaryLoggedEvent(target, {label: "원래 일", back: true});

        expect(forward.payload["title"]).toContain("딴 일");
        expect(back.payload["title"]).toContain("↩");
    });

    it("아주 긴 라벨은 잘라 싣는다", () => {
        const event = boundaryLoggedEvent(target, {label: "가".repeat(400), back: false});
        const metadata = event.payload["metadata"] as Record<string, unknown>;

        expect(String(metadata["agent_tracer.boundary.label"])).toHaveLength(120);
    });
});
