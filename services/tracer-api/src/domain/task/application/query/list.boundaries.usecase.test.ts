import { describe, expect, it } from "vitest";
import { pairBoundaries, type BoundaryMark } from "./boundary.pairing.js";

function mark(turnIndex: number, label: string, back = false): BoundaryMark {
    return {
        sessionId: "s1",
        turnIndex,
        label,
        back,
        occurredAt: `2026-01-01T00:0${turnIndex}:00.000Z`,
    };
}

const LAST = new Map([["s1", 9]]);

describe("pairBoundaries", () => {
    it("여는 마커와 복귀 마커 사이를 닫힌 구간으로 만든다", () => {
        const ranges = pairBoundaries([mark(3, "로그인 버그"), mark(6, "원래 작업", true)], LAST);

        expect(ranges).toEqual([
            expect.objectContaining({ fromTurnIndex: 3, toTurnIndex: 5, label: "로그인 버그" }),
        ]);
    });

    // 복귀 마커 없이 세션이 끝난 경우이며, 이어서 다른 일을 한 세션이 여기서 꼬리 분리로 풀린다.
    it("복귀 마커가 없으면 그 세션의 마지막 턴까지가 구간이다", () => {
        const ranges = pairBoundaries([mark(4, "이어서 다른 일")], LAST);

        expect(ranges).toEqual([
            expect.objectContaining({ fromTurnIndex: 4, toTurnIndex: 9 }),
        ]);
    });

    it("복귀 없이 다음 경계가 열리면 앞 구간은 그 자리에서 끝난다", () => {
        const ranges = pairBoundaries([mark(2, "A"), mark(5, "B")], LAST);

        expect(ranges).toEqual([
            expect.objectContaining({ fromTurnIndex: 2, toTurnIndex: 4, label: "A" }),
            expect.objectContaining({ fromTurnIndex: 5, toTurnIndex: 9, label: "B" }),
        ]);
    });

    it("짝 없는 복귀 마커는 구간을 만들지 않는다", () => {
        expect(pairBoundaries([mark(3, "복귀", true)], LAST)).toEqual([]);
    });

    it("바로 다음 턴에서 되돌아오면 한 턴짜리 구간이다", () => {
        const ranges = pairBoundaries([mark(3, "잠깐 딴 일"), mark(4, "복귀", true)], LAST);

        expect(ranges).toEqual([
            expect.objectContaining({ fromTurnIndex: 3, toTurnIndex: 3 }),
        ]);
    });

    it("마커가 없으면 제안도 없다", () => {
        expect(pairBoundaries([], LAST)).toEqual([]);
    });
});
