import { describe, expect, it } from "vitest";
import { makeSplitHarness, ORIGIN_TASK, SESSION, USER } from "./__fixtures__/split.harness.js";

const TURNS = new Map([
    [1, `${SESSION}#0001`],
    [2, `${SESSION}#0002`],
    [3, `${SESSION}#0003`],
    [4, `${SESSION}#0004`],
]);

async function splitThenHarness() {
    const h = makeSplitHarness({ turnIdsByIndex: TURNS });
    const result = await h.split.execute(USER, ORIGIN_TASK, {
        sessionId: SESSION,
        fromTurnIndex: 3,
        toTurnIndex: 4,
        newTitle: "로그인 버그",
    });
    return { h, splitTaskId: result.taskId };
}

describe("RevertTaskSplitUseCase", () => {
    it("옮겼던 턴을 원래 태스크로 돌려놓는다", async () => {
        const { h, splitTaskId } = await splitThenHarness();

        const result = await h.revert.execute(USER, splitTaskId);

        expect(result.restoredTurnCount).toBe(2);
        expect(h.writer.moves.at(-1)).toEqual({
            sessionId: SESSION,
            fromTurnIndex: 3,
            toTurnIndex: 4,
            taskId: ORIGIN_TASK,
        });
    });

    it("구간 행을 지워 재할당을 없앤다", async () => {
        const { h, splitTaskId } = await splitThenHarness();

        await h.revert.execute(USER, splitTaskId);

        expect(h.ranges.all()).toEqual([]);
    });

    it("분리가 만든 빈 태스크는 남기지 않는다", async () => {
        const { h, splitTaskId } = await splitThenHarness();

        const result = await h.revert.execute(USER, splitTaskId);

        expect(result.taskRemoved).toBe(true);
        expect(h.writer.deleted).toEqual([splitTaskId]);
        expect(h.search.removed).toContain(splitTaskId);
    });

    it("분리로 태어나지 않은 태스크는 지우지 않는다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        const result = await h.revert.execute(USER, ORIGIN_TASK);

        expect(result.restoredTurnCount).toBe(0);
        expect(result.taskRemoved).toBe(false);
        expect(h.writer.deleted).toEqual([]);
    });

    it("없는 태스크는 존재를 알리지 않는다", async () => {
        const h = makeSplitHarness();

        await expect(h.revert.execute(USER, "unknown")).rejects.toThrow(/Task not found/);
    });
});
