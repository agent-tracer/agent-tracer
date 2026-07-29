import { Inject, Injectable } from "@nestjs/common";
import type { MemoAuthor } from "@agent-tracer/kernel";
import { MemoEntity, SEARCH_OUTBOX_TARGET, SearchOutboxEntity } from "@agent-tracer/tracer-model";
import { CLOCK, type ClockPort } from "~tracer-api/domain/memo/port/clock.port.js";
import { MEMO_ID_GENERATOR, type MemoIdGeneratorPort } from "~tracer-api/domain/memo/port/memo.id.generator.port.js";
import { MEMO_TRANSACTION, type MemoTransactionPort, type MemoTx } from "~tracer-api/domain/memo/port/memo.transaction.port.js";
import { mapMemo, type MemoDto } from "~tracer-api/domain/memo/model/memo.model.js";

export interface CreateMemoInput {
    readonly userId: string;
    readonly taskId: string;
    readonly eventId?: string | null;
    readonly body: string;
    readonly author: MemoAuthor;
}

@Injectable()
export class CreateMemoUseCase {
    constructor(
        @Inject(MEMO_TRANSACTION)
        private readonly tx: MemoTransactionPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
        @Inject(MEMO_ID_GENERATOR)
        private readonly idGenerator: MemoIdGeneratorPort,
    ) {}

    async execute(input: CreateMemoInput): Promise<{ readonly memo: MemoDto }> {
        const now = this.clock.now();
        const memo = await this.tx.run((tx) => this.applyInTransaction(tx, input, now));
        return { memo: mapMemo(memo) };
    }

    private async applyInTransaction(tx: MemoTx, input: CreateMemoInput, now: Date): Promise<MemoEntity> {
        // 쓰레드라 기존 행을 찾지 않고 항상 새 메모를 심는다.
        const memo = MemoEntity.create({
            id: this.idGenerator.next(),
            userId: input.userId,
            taskId: input.taskId,
            eventId: input.eventId ?? null,
            body: input.body,
            author: input.author,
            now,
        });
        await tx.memos.upsert(memo);
        await tx.searchOutbox.enqueue(
            SearchOutboxEntity.enqueue({
                id: this.idGenerator.next(),
                userId: input.userId,
                target: SEARCH_OUTBOX_TARGET.memo,
                targetId: memo.id,
                now,
            }),
        );
        return memo;
    }
}
