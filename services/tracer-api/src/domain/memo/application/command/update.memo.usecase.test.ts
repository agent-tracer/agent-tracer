import { describe, expect, it } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { MEMO_AUTHOR } from "@agent-tracer/kernel";
import { MemoEntity } from "@agent-tracer/tracer-model";
import { FixedClock } from "~tracer-api/domain/memo/port/__fakes__/fixed.clock.js";
import { InMemoryMemoTransaction } from "~tracer-api/domain/memo/port/__fakes__/in-memory.memo.transaction.js";
import { SequentialMemoIdGenerator } from "~tracer-api/domain/memo/port/__fakes__/sequential.memo.id.generator.js";
import { UpdateMemoUseCase } from "./update.memo.usecase.js";

const clock = new FixedClock(new Date("2026-01-02T00:00:00.000Z"));

function createUseCase(tx: InMemoryMemoTransaction): UpdateMemoUseCase {
    return new UpdateMemoUseCase(tx, clock, new SequentialMemoIdGenerator());
}

function memo(overrides: Partial<MemoEntity> = {}): MemoEntity {
    const entity = MemoEntity.create({
        id: "m1",
        userId: "u1",
        taskId: "t1",
        eventId: null,
        body: "원본",
        author: MEMO_AUTHOR.agent,
        now: new Date("2026-01-01T00:00:00.000Z"),
    });
    Object.assign(entity, overrides);
    return entity;
}

describe("UpdateMemoUseCase", () => {
    it("본문을 고치고 편집자를 사람으로 세우며 rev를 올린다", async () => {
        const tx = new InMemoryMemoTransaction();
        tx.memos.seed(memo());
        const useCase = createUseCase(tx);

        const result = await useCase.execute({ userId: "u1", id: "m1", body: "고친 메모" });

        expect(result.memo.body).toBe("고친 메모");
        expect(result.memo.lastEditedBy).toBe(MEMO_AUTHOR.human);
        expect(result.memo.rev).toBe(2);
        expect(tx.searchOutbox.all()).toHaveLength(1);
        expect(tx.searchOutbox.all()[0]?.id).toBe("memo-id-1");
    });

    it("남의 메모는 찾을 수 없다고 응답한다", async () => {
        const tx = new InMemoryMemoTransaction();
        tx.memos.seed(memo({ userId: "u2" }));
        const useCase = createUseCase(tx);

        await expect(useCase.execute({ userId: "u1", id: "m1", body: "고친 메모" })).rejects.toBeInstanceOf(NotFoundException);
        expect(tx.searchOutbox.all()).toHaveLength(0);
    });

    it("삭제된 메모는 찾을 수 없다고 응답한다", async () => {
        const deleted = memo();
        deleted.softDelete(new Date("2026-01-01T01:00:00.000Z"));
        const tx = new InMemoryMemoTransaction();
        tx.memos.seed(deleted);
        const useCase = createUseCase(tx);

        await expect(useCase.execute({ userId: "u1", id: "m1", body: "고친 메모" })).rejects.toBeInstanceOf(NotFoundException);
    });
});
