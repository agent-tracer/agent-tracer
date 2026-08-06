import { describe, expect, it } from "vitest";
import {
    movedTurnIndexes,
    planRangeInsert,
    resolveTurnTaskId,
    type StoredRange,
} from "./turn.reassignment.domain.js";

function range(id: string, from: number, to: number, taskId = "B"): StoredRange {
    return { id, fromTurnIndex: from, toTurnIndex: to, taskId, originTaskId: "A" };
}

describe("planRangeInsert", () => {
    it("겹치는 구간이 없으면 새 구간만 만든다", () => {
        const plan = planRangeInsert([range("r1", 1, 2)], {
            fromTurnIndex: 5,
            toTurnIndex: 6,
            taskId: "C",
            originTaskId: "A",
        });

        expect(plan.removedIds).toEqual([]);
        expect(plan.updated).toEqual([]);
        expect(plan.created).toHaveLength(1);
    });

    it("새 구간이 기존 구간을 통째로 덮으면 기존 구간을 지운다", () => {
        const plan = planRangeInsert([range("r1", 3, 4)], {
            fromTurnIndex: 2,
            toTurnIndex: 6,
            taskId: "C",
            originTaskId: "A",
        });

        expect(plan.removedIds).toEqual(["r1"]);
        expect(plan.updated).toEqual([]);
    });

    it("앞쪽이 겹치면 기존 구간의 시작을 뒤로 민다", () => {
        const plan = planRangeInsert([range("r1", 3, 8)], {
            fromTurnIndex: 1,
            toTurnIndex: 4,
            taskId: "C",
            originTaskId: "A",
        });

        expect(plan.removedIds).toEqual([]);
        expect(plan.updated).toEqual([expect.objectContaining({ id: "r1", fromTurnIndex: 5, toTurnIndex: 8 })]);
    });

    it("뒤쪽이 겹치면 기존 구간의 끝을 앞으로 당긴다", () => {
        const plan = planRangeInsert([range("r1", 3, 8)], {
            fromTurnIndex: 6,
            toTurnIndex: 9,
            taskId: "C",
            originTaskId: "A",
        });

        expect(plan.updated).toEqual([expect.objectContaining({ id: "r1", fromTurnIndex: 3, toTurnIndex: 5 })]);
    });

    it("기존 구간 한가운데를 파면 앞뒤 두 조각으로 갈라진다", () => {
        const plan = planRangeInsert([range("r1", 1, 10)], {
            fromTurnIndex: 4,
            toTurnIndex: 5,
            taskId: "C",
            originTaskId: "A",
        });

        expect(plan.updated).toEqual([expect.objectContaining({ id: "r1", fromTurnIndex: 1, toTurnIndex: 3 })]);
        expect(plan.created).toEqual([
            expect.objectContaining({ fromTurnIndex: 4, toTurnIndex: 5, taskId: "C" }),
            expect.objectContaining({ fromTurnIndex: 6, toTurnIndex: 10, taskId: "B" }),
        ]);
    });

    it("맞닿기만 한 구간은 자르지 않는다", () => {
        const plan = planRangeInsert([range("r1", 1, 3)], {
            fromTurnIndex: 4,
            toTurnIndex: 6,
            taskId: "C",
            originTaskId: "A",
        });

        expect(plan.removedIds).toEqual([]);
        expect(plan.updated).toEqual([]);
    });

    it("같은 구간을 다시 분리하면 앞의 것이 사라지고 새 대상만 남는다", () => {
        const plan = planRangeInsert([range("r1", 3, 5, "B")], {
            fromTurnIndex: 3,
            toTurnIndex: 5,
            taskId: "C",
            originTaskId: "A",
        });

        expect(plan.removedIds).toEqual(["r1"]);
        expect(plan.created).toEqual([expect.objectContaining({ taskId: "C" })]);
    });

    it("뒤집힌 구간과 0 이하 인덱스는 거절한다", () => {
        expect(() =>
            planRangeInsert([], { fromTurnIndex: 5, toTurnIndex: 3, taskId: "C", originTaskId: "A" }),
        ).toThrow(/inverted/);
        expect(() =>
            planRangeInsert([], { fromTurnIndex: 0, toTurnIndex: 3, taskId: "C", originTaskId: "A" }),
        ).toThrow(/index-too-small/);
    });
});

describe("resolveTurnTaskId", () => {
    it("구간에 든 턴은 옮겨 간 태스크에 속한다", () => {
        expect(resolveTurnTaskId([range("r1", 3, 4)], 3, "A")).toBe("B");
        expect(resolveTurnTaskId([range("r1", 3, 4)], 4, "A")).toBe("B");
    });

    it("구간 밖의 턴은 원래 태스크에 남는다", () => {
        expect(resolveTurnTaskId([range("r1", 3, 4)], 2, "A")).toBe("A");
        expect(resolveTurnTaskId([range("r1", 3, 4)], 5, "A")).toBe("A");
        expect(resolveTurnTaskId([], 1, "A")).toBe("A");
    });
});

describe("movedTurnIndexes", () => {
    it("구간을 인덱스 목록으로 편다", () => {
        expect(movedTurnIndexes([range("r1", 3, 5), range("r2", 8, 8)])).toEqual([3, 4, 5, 8]);
    });
});
