import { describe, expect, it } from "vitest";
import type { ApplyLedgerBatchUseCase } from "~tracer-api/domain/projection/application/apply.ledger.batch.usecase.js";
import {
    LEDGER_CURSOR_NAME,
    LedgerPollConsumer,
} from "~tracer-api/domain/projection/inbound/ledger.poll.consumer.js";
import type { LedgerSource, ProjectionCursorStore } from "~tracer-api/support/ledger.source.js";
import type { LedgerRecord } from "~tracer-api/support/ledger.record.js";

function record(seq: number): LedgerRecord {
    return {
        id: `event-${seq}`,
        seq: String(seq),
        userId: "user-1",
        taskId: "task-1",
        sessionId: "session-1",
        kind: "userMessage" as LedgerRecord["kind"],
        occurredAt: new Date("2026-01-01T00:00:00.000Z"),
        receivedAt: new Date("2026-01-01T00:00:00.000Z"),
        traceId: "trace-1",
        spanId: "span-1",
        parentSpanId: null,
        payload: {},
    };
}

class FakeLedgerSource implements LedgerSource {
    readonly calls: { seq: number; limit: number }[] = [];

    constructor(private readonly pages: LedgerRecord[][]) {}

    readAfter(seq: number, limit: number): Promise<readonly LedgerRecord[]> {
        this.calls.push({ seq, limit });
        return Promise.resolve(this.pages.shift() ?? []);
    }
}

class FakeCursor implements ProjectionCursorStore {
    constructor(public seq = 0) {}

    read(): Promise<number> {
        return Promise.resolve(this.seq);
    }

    write(_name: string, seq: number): Promise<void> {
        this.seq = seq;
        return Promise.resolve();
    }
}

function fakeApply(applied: LedgerRecord[][]): ApplyLedgerBatchUseCase {
    return {
        execute: (records: Iterable<LedgerRecord>) => {
            applied.push([...records]);
            return Promise.resolve();
        },
    } as unknown as ApplyLedgerBatchUseCase;
}

describe("LedgerPollConsumer", () => {
    it("커서 뒤의 원장을 투영에 넘기고 마지막 seq로 커서를 옮긴다", async () => {
        const applied: LedgerRecord[][] = [];
        const source = new FakeLedgerSource([[record(1), record(2)]]);
        const cursor = new FakeCursor(0);
        const consumer = new LedgerPollConsumer(source, cursor, fakeApply(applied));

        expect(await consumer.runOnce()).toBe(2);
        expect(applied[0]?.map((row) => row.id)).toEqual(["event-1", "event-2"]);
        expect(cursor.seq).toBe(2);
        expect(source.calls[0]?.seq).toBe(0);
    });

    it("읽을 원장이 없으면 투영을 부르지 않고 커서를 그대로 둔다", async () => {
        const applied: LedgerRecord[][] = [];
        const cursor = new FakeCursor(7);
        const consumer = new LedgerPollConsumer(new FakeLedgerSource([[]]), cursor, fakeApply(applied));

        expect(await consumer.runOnce()).toBe(0);
        expect(applied).toHaveLength(0);
        expect(cursor.seq).toBe(7);
    });

    it("배치가 가득 차면 남은 원장이 없을 때까지 이어 읽는다", async () => {
        const full = Array.from({ length: 100 }, (_, index) => record(index + 1));
        const applied: LedgerRecord[][] = [];
        const source = new FakeLedgerSource([full, [record(101)]]);
        const consumer = new LedgerPollConsumer(source, new FakeCursor(0), fakeApply(applied));

        expect(await consumer.drain()).toBe(101);
        expect(applied).toHaveLength(2);
        expect(source.calls[1]?.seq).toBe(100);
    });

    it("커서 이름을 한 곳에서만 정한다", () => {
        expect(LEDGER_CURSOR_NAME).toBe("ledger");
    });
});
