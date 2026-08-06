import { describe, expect, it } from "vitest";
import { SESSION_STATUS } from "@agent-tracer/tracer-model";
import {
    makeSplitHarness,
    makeTask,
    ORIGIN_TASK,
    SESSION,
    USER,
} from "./__fixtures__/split.harness.js";

const TURNS = new Map([
    [1, `${SESSION}#0001`],
    [2, `${SESSION}#0002`],
    [3, `${SESSION}#0003`],
    [4, `${SESSION}#0004`],
    [5, `${SESSION}#0005`],
    [6, `${SESSION}#0006`],
]);

function command(from: number, to: number, newTitle = "로그인 버그") {
    return { sessionId: SESSION, fromTurnIndex: from, toTurnIndex: to, newTitle };
}

describe("SplitTaskTurnsUseCase", () => {
    it("새 태스크를 만들고 구간을 그 태스크로 옮긴다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        const result = await h.split.execute(USER, ORIGIN_TASK, command(3, 4));

        expect(result.created).toBe(true);
        expect(result.title).toBe("로그인 버그");
        expect(result.movedTurnCount).toBe(2);
        expect(h.writer.moves).toEqual([
            { sessionId: SESSION, fromTurnIndex: 3, toTurnIndex: 4, taskId: result.taskId },
        ]);
    });

    it("만들어진 태스크는 원본을 가리키고 사용자 제목 순위를 갖는다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        const result = await h.split.execute(USER, ORIGIN_TASK, command(3, 4));
        const created = await h.tasks.findById(USER, result.taskId);

        expect(created?.splitFromTaskId).toBe(ORIGIN_TASK);
        expect(created?.titleRank).toBe("user");
        expect(created?.parentTaskId).toBeNull();
        expect(created?.status).toBe("completed");
    });

    // 구간 밖의 턴은 손대지 않으므로 앞뒤 조각이 저절로 같은 태스크로 남는다.
    it("중간 구간을 떼도 앞뒤 턴은 원본에 남는다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        await h.split.execute(USER, ORIGIN_TASK, command(3, 4));

        expect(h.ranges.all()).toEqual([
            expect.objectContaining({ fromTurnIndex: 3, toTurnIndex: 4, originTaskId: ORIGIN_TASK }),
        ]);
        expect(h.writer.moves[0]?.fromTurnIndex).toBe(3);
        expect(h.writer.moves[0]?.toTurnIndex).toBe(4);
    });

    it("옮긴 턴을 따라 자식 태스크와 규칙 anchor도 옮긴다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        const result = await h.split.execute(USER, ORIGIN_TASK, command(3, 4));

        expect(h.writer.childMoves).toEqual([
            { turnIds: [`${SESSION}#0003`, `${SESSION}#0004`], taskId: result.taskId },
        ]);
        expect(h.writer.anchorMoves).toEqual([
            { turnIds: [`${SESSION}#0003`, `${SESSION}#0004`], taskId: result.taskId },
        ]);
    });

    it("양쪽 태스크의 활동 시각을 다시 세고 색인을 갱신한다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        const result = await h.split.execute(USER, ORIGIN_TASK, command(3, 4));

        expect(h.writer.refreshed).toEqual([[ORIGIN_TASK, result.taskId]]);
        expect(h.search.indexed).toEqual([result.taskId, ORIGIN_TASK]);
    });

    // 옮겨 간 턴을 가리키던 판정은 규칙이 함께 가지 않았으면 남의 태스크를 가리키게 된다.
    it("옮긴 턴 위에서 규칙 판정을 다시 계산한다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        const result = await h.split.execute(USER, ORIGIN_TASK, command(3, 4));

        expect(h.realigner.calls).toEqual([
            {
                turnIds: [`${SESSION}#0003`, `${SESSION}#0004`],
                taskIds: [ORIGIN_TASK, result.taskId],
            },
        ]);
    });

    // 살아 있는 세션을 자르면 서버만 옮겨지고 터미널은 원본 태스크를 계속 붙잡는다.
    it("아직 실행 중인 세션은 거절한다", async () => {
        const h = makeSplitHarness({ sessionStatus: SESSION_STATUS.active, turnIdsByIndex: TURNS });

        await expect(h.split.execute(USER, ORIGIN_TASK, command(3, 4))).rejects.toThrow(/still running/);
        expect(h.writer.moves).toEqual([]);
    });

    it("남의 태스크나 없는 태스크는 존재를 알리지 않는다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        await expect(h.split.execute(USER, "unknown", command(3, 4))).rejects.toThrow(/Task not found/);
    });

    it("다른 태스크의 세션은 자르지 못한다", async () => {
        const h = makeSplitHarness({
            tasks: [makeTask(ORIGIN_TASK), makeTask("task-other")],
            turnIdsByIndex: TURNS,
        });

        await expect(h.split.execute(USER, "task-other", command(3, 4))).rejects.toThrow(/Session not found/);
    });

    it("기존 태스크를 대상으로 지정하면 새로 만들지 않는다", async () => {
        const h = makeSplitHarness({
            tasks: [makeTask(ORIGIN_TASK), makeTask("task-B")],
            turnIdsByIndex: TURNS,
        });

        const result = await h.split.execute(USER, ORIGIN_TASK, {
            sessionId: SESSION,
            fromTurnIndex: 3,
            toTurnIndex: 4,
            targetTaskId: "task-B",
        });

        expect(result.created).toBe(false);
        expect(result.taskId).toBe("task-B");
        expect(h.tasks.all()).toHaveLength(2);
    });

    it("겹치는 구간을 다시 자르면 앞의 구간을 잘라 낸다", async () => {
        const h = makeSplitHarness({ turnIdsByIndex: TURNS });

        await h.split.execute(USER, ORIGIN_TASK, command(2, 5, "첫 분리"));
        await h.split.execute(USER, ORIGIN_TASK, command(3, 4, "두 번째 분리"));

        const ranges = h.ranges.all();
        expect(ranges.map((row) => [row.fromTurnIndex, row.toTurnIndex])).toEqual([[2, 2], [3, 4], [5, 5]]);
    });
});
