import { describe, expect, it } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { CLEANUP_SUGGESTION_STATUS, TASK_CLEANUP_SUGGESTION_KIND } from "@agent-tracer/kernel";
import { TaskEntity } from "@agent-tracer/tracer-model";
import { FixedClock } from "~tracer-api/domain/cleanup/port/__fakes__/fixed.clock.js";
import { InMemoryCleanupTransaction } from "~tracer-api/domain/cleanup/port/__fakes__/in-memory.cleanup.transaction.js";
import { SequentialCleanupIdGenerator } from "~tracer-api/domain/cleanup/port/__fakes__/sequential.cleanup.id.generator.js";
import { CreateCleanupSuggestionsUseCase } from "./create.cleanup.suggestions.usecase.js";

const NOW = new Date("2026-03-01T00:00:00.000Z");
const clock = new FixedClock(NOW);

function task(id: string, userId: string, lastEventAt: Date | null): TaskEntity {
    const entity = new TaskEntity();
    entity.id = id;
    entity.userId = userId;
    entity.title = "태스크";
    entity.slug = id;
    entity.workspacePath = null;
    entity.status = "completed";
    entity.taskKind = "primary";
    entity.origin = "user";
    entity.cliSource = null;
    entity.parentTaskId = null;
    entity.parentSessionId = null;
    entity.backgroundOfTaskId = null;
    entity.createdAt = NOW;
    entity.updatedAt = NOW;
    entity.lastSessionStartedAt = null;
    entity.lastEventAt = lastEventAt;
    return entity;
}

function draft(taskId: string, rationale = "마지막 활동 이후 오래 멈춰 있다") {
    return { taskId, kind: TASK_CLEANUP_SUGGESTION_KIND.archive, rationale };
}

function makeUseCase(tasks: readonly TaskEntity[]): {
    readonly useCase: CreateCleanupSuggestionsUseCase;
    readonly tx: InMemoryCleanupTransaction;
} {
    const tx = new InMemoryCleanupTransaction();
    tx.tasks.seed(...tasks);
    return { useCase: new CreateCleanupSuggestionsUseCase(tx, clock, new SequentialCleanupIdGenerator()), tx };
}

describe("CreateCleanupSuggestionsUseCase", () => {
    it("요청에 실린 순서대로 대기 제안을 만들고 태스크의 마지막 활동 시각을 적는다", async () => {
        const lastEventAt = new Date("2026-02-01T00:00:00.000Z");
        const { useCase, tx } = makeUseCase([task("t1", "u1", lastEventAt), task("t2", "u1", null)]);

        const result = await useCase.execute({
            userId: "u1",
            jobId: "job-1",
            drafts: [draft("t1", "첫째 근거"), draft("t2", "둘째 근거")],
        });

        expect(result.suggestions.map((row) => row.taskId)).toEqual(["t1", "t2"]);
        expect(result.suggestions.map((row) => row.status)).toEqual([
            CLEANUP_SUGGESTION_STATUS.pending,
            CLEANUP_SUGGESTION_STATUS.pending,
        ]);
        expect(result.suggestions.map((row) => row.jobId)).toEqual(["job-1", "job-1"]);
        expect(result.suggestions.every((row) => row.currentValue === null && row.proposedValue === null)).toBe(true);
        expect(tx.cleanupSuggestions.all().find((row) => row.taskId === "t1")?.observedLastEventAt).toEqual(lastEventAt);
    });

    it("실행을 싣지 않으면 빈 문자열로 적는다", async () => {
        const { useCase } = makeUseCase([task("t1", "u1", null)]);

        const result = await useCase.execute({ userId: "u1", drafts: [draft("t1")] });

        expect(result.suggestions[0]!.jobId).toBe("");
    });

    it("같은 태스크와 종류의 대기 제안이 있으면 그 행을 고치고 대기 행을 늘리지 않는다", async () => {
        const { useCase, tx } = makeUseCase([task("t1", "u1", new Date("2026-02-01T00:00:00.000Z"))]);
        const first = await useCase.execute({ userId: "u1", jobId: "job-1", drafts: [draft("t1", "첫째 근거")] });

        const second = await useCase.execute({ userId: "u1", jobId: "job-2", drafts: [draft("t1", "둘째 근거")] });

        expect(tx.cleanupSuggestions.all()).toHaveLength(1);
        expect(second.suggestions[0]!.id).toBe(first.suggestions[0]!.id);
        expect(second.suggestions[0]!.rationale).toBe("둘째 근거");
        expect(second.suggestions[0]!.jobId).toBe("job-2");
        expect(second.suggestions[0]!.createdAt).toBe(first.suggestions[0]!.createdAt);
    });

    it("한 호출이 같은 태스크를 두 번 실어도 대기 행은 하나로 남는다", async () => {
        const { useCase, tx } = makeUseCase([task("t1", "u1", null)]);

        const result = await useCase.execute({ userId: "u1", drafts: [draft("t1", "첫째"), draft("t1", "둘째")] });

        expect(tx.cleanupSuggestions.all()).toHaveLength(1);
        expect(result.suggestions.map((row) => row.id)).toEqual([
            result.suggestions[0]!.id,
            result.suggestions[0]!.id,
        ]);
        expect(tx.cleanupSuggestions.all()[0]!.rationale).toBe("둘째");
    });

    it("해소된 제안은 건드리지 않고 새 대기 행을 만든다", async () => {
        const { useCase, tx } = makeUseCase([task("t1", "u1", null)]);
        const first = await useCase.execute({ userId: "u1", drafts: [draft("t1", "첫째")] });
        const standing = tx.cleanupSuggestions.all()[0]!;
        standing.dismiss(NOW);
        await tx.cleanupSuggestions.upsert(standing);

        const second = await useCase.execute({ userId: "u1", drafts: [draft("t1", "둘째")] });

        expect(tx.cleanupSuggestions.all()).toHaveLength(2);
        expect(second.suggestions[0]!.id).not.toBe(first.suggestions[0]!.id);
        expect(second.suggestions[0]!.status).toBe(CLEANUP_SUGGESTION_STATUS.pending);
    });

    it("남의 태스크를 가리키면 찾을 수 없다고 응답하고 아무것도 쓰지 않는다", async () => {
        const { useCase, tx } = makeUseCase([task("t1", "u1", null), task("t2", "u2", null)]);

        await expect(
            useCase.execute({ userId: "u1", drafts: [draft("t1"), draft("t2")] }),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(tx.cleanupSuggestions.all()).toHaveLength(0);
    });

    it("없는 태스크를 가리키면 찾을 수 없다고 응답한다", async () => {
        const { useCase } = makeUseCase([]);

        await expect(useCase.execute({ userId: "u1", drafts: [draft("missing")] })).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });
});
