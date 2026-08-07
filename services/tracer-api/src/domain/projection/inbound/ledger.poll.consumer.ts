import { Inject, Injectable } from "@nestjs/common";
import { ApplyLedgerBatchUseCase } from "~tracer-api/domain/projection/application/apply.ledger.batch.usecase.js";
import type { LedgerSource, ProjectionCursorStore } from "~tracer-api/support/ledger.source.js";
import { LEDGER_SOURCE, PROJECTION_CURSOR } from "~tracer-api/support/projector.tokens.js";

/** 브로커 오프셋을 대신하는 커서 이름이다. */
export const LEDGER_CURSOR_NAME = "ledger";

const BATCH_SIZE = 100;

/** 커서를 투영 커밋 뒤에 옮겨 브로커를 쓰던 때와 같은 최소 한 번 전달을 유지한다. */
@Injectable()
export class LedgerPollConsumer {
    constructor(
        @Inject(LEDGER_SOURCE) private readonly source: LedgerSource,
        @Inject(PROJECTION_CURSOR) private readonly cursor: ProjectionCursorStore,
        private readonly applyLedgerBatch: ApplyLedgerBatchUseCase,
    ) {}

    /** 한 배치만 처리하고 처리한 건수를 돌려준다. */
    async runOnce(): Promise<number> {
        const from = await this.cursor.read(LEDGER_CURSOR_NAME);
        const records = await this.source.readAfter(from, BATCH_SIZE);
        if (records.length === 0) return 0;

        await this.applyLedgerBatch.execute(records, () => Promise.resolve());

        const last = records[records.length - 1];
        if (last !== undefined) await this.cursor.write(LEDGER_CURSOR_NAME, Number(last.seq));
        return records.length;
    }

    /** 남은 원장이 없을 때까지 이어서 처리한다. */
    async drain(): Promise<number> {
        let total = 0;
        for (;;) {
            const applied = await this.runOnce();
            total += applied;
            if (applied < BATCH_SIZE) return total;
        }
    }
}
