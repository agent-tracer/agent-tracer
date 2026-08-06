import {describe, expect, it} from "vitest";
import {KIND} from "~plugin/domain/ingest/model/event.model.js";
import type {RecentEvent} from "~plugin/domain/ingest/model/recent.event.model.js";
import {detectTopicShift} from "./topic.shift.model.js";

function toolEvent(turnId: string, filePaths: readonly string[], toolName?: string): RecentEvent {
    return {
        kind: KIND.executeTool,
        occurredAt: "2026-01-01T00:00:00.000Z",
        turnId,
        ...(toolName === undefined ? {} : {toolName}),
        filePaths,
        metadata: {},
    };
}

function boundaryEvent(turnId: string): RecentEvent {
    return {
        kind: KIND.boundaryLogged,
        occurredAt: "2026-01-01T00:00:00.000Z",
        turnId,
        metadata: {},
    };
}

const THREE_TURNS: readonly RecentEvent[] = [
    toolEvent("turn-1", ["src/auth/login.ts"]),
    toolEvent("turn-2", ["src/auth/session.ts"]),
    toolEvent("turn-3", ["src/auth/token.ts"]),
];

describe("detectTopicShift", () => {
    it("직전 턴들이 다룬 파일과 하나도 겹치지 않으면 경계를 남기라고 제안한다", () => {
        const hints = detectTopicShift(THREE_TURNS, "결제 영수증 PDF 렌더링을 고쳐줘");

        expect(hints).toHaveLength(1);
        expect(hints[0]?.type).toBe("topic_shift");
        expect(hints[0]?.message).toContain("mark_boundary");
    });

    it("같은 파일을 이어서 다루면 제안하지 않는다", () => {
        expect(detectTopicShift(THREE_TURNS, "session.ts 도 같이 고쳐줘")).toEqual([]);
    });

    it("턴이 아직 얼마 없으면 작업이 바뀌었는지 판단하지 않는다", () => {
        const twoTurns = THREE_TURNS.slice(0, 2);

        expect(detectTopicShift(twoTurns, "전혀 다른 이야기")).toEqual([]);
    });

    // 한 번 남긴 뒤 곧바로 또 제안하면 마커가 무의미하게 쌓인다.
    it("방금 경계를 남겼으면 다시 제안하지 않는다", () => {
        const recent = [...THREE_TURNS, boundaryEvent("turn-3")];

        expect(detectTopicShift(recent, "결제 영수증 PDF 렌더링")).toEqual([]);
    });

    it("경계를 남기고 턴이 충분히 지나면 다시 제안한다", () => {
        const recent = [
            ...THREE_TURNS,
            boundaryEvent("turn-1"),
            toolEvent("turn-4", ["src/auth/scope.ts"]),
            toolEvent("turn-5", ["src/auth/role.ts"]),
        ];

        expect(detectTopicShift(recent, "결제 영수증 PDF 렌더링")).toHaveLength(1);
    });

    it("직전 턴들이 다룬 파일이 없으면 겹침을 볼 근거가 없어 제안하지 않는다", () => {
        const recent = [toolEvent("turn-1", []), toolEvent("turn-2", []), toolEvent("turn-3", [])];

        expect(detectTopicShift(recent, "전혀 다른 이야기")).toEqual([]);
    });

    it("빈 프롬프트는 판단하지 않는다", () => {
        expect(detectTopicShift(THREE_TURNS, "   ")).toEqual([]);
    });
});
