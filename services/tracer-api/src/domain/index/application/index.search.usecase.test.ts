import { describe, expect, it } from "vitest";
import { KIND } from "@agent-tracer/kernel";
import type { LedgerRecord } from "~tracer-api/support/ledger.record.js";
import { IndexSearchUseCase } from "~tracer-api/domain/index/application/index.search.usecase.js";
import { EVENTS_INDEX, TASKS_INDEX } from "~tracer-api/domain/index/model/search.index.definitions.js";
import { InMemorySearchIndex } from "~tracer-api/domain/index/port/__fakes__/in-memory.search.index.js";
import type { SearchBulkOperation } from "~tracer-api/domain/index/port/search.index.writer.port.js";

const NOW = new Date("2026-07-01T00:00:00.000Z");

function makeRecord(overrides: Partial<LedgerRecord> = {}): LedgerRecord {
    return {
        id: "ev-1",
        seq: "7",
        userId: "u1",
        taskId: "t1",
        sessionId: null,
        kind: KIND.executeTool,
        occurredAt: NOW,
        receivedAt: NOW,
        traceId: "trace",
        spanId: "span",
        parentSpanId: null,
        payload: {},
        ...overrides,
    };
}

function makeUseCase(): { useCase: IndexSearchUseCase; bulks: readonly SearchBulkOperation[][] } {
    const searchIndex = new InMemorySearchIndex();
    return { useCase: new IndexSearchUseCase(searchIndex), bulks: searchIndex.bulks };
}

describe("IndexSearchUseCase", () => {
    it("타임라인 이벤트는 이벤트 색인에 넣는다", async () => {
        const { useCase, bulks } = makeUseCase();

        await useCase.execute([makeRecord()]);

        expect(bulks[0]?.[0]).toMatchObject({
            action: "index",
            index: EVENTS_INDEX,
            id: "ev-1",
            document: { userId: "u1", taskId: "t1", kind: KIND.executeTool, seq: 7 },
        });
    });

    it("실행 이벤트는 태스크 문서를 upsert한다", async () => {
        const { useCase, bulks } = makeUseCase();

        await useCase.execute([makeRecord({ kind: KIND.taskLinked })]);

        expect(bulks[0]?.[0]).toMatchObject({
            action: "update",
            index: TASKS_INDEX,
            id: '["u1","t1"]',
            upsert: true,
        });
    });

    it("같은 taskId라도 사용자마다 다른 검색 문서를 갱신한다", async () => {
        const { useCase, bulks } = makeUseCase();

        await useCase.execute([
            makeRecord({ kind: KIND.taskLinked, userId: "u1", taskId: "t1" }),
            makeRecord({ id: "ev-2", kind: KIND.taskLinked, userId: "u2", taskId: "t1" }),
        ]);

        expect(bulks[0]?.map((operation) => operation.id)).toEqual(['["u1","t1"]', '["u2","t1"]']);
    });

    it("색인 대상이 없으면 벌크를 부르지 않는다", async () => {
        const { useCase, bulks } = makeUseCase();

        await useCase.execute([]);

        expect(bulks).toEqual([]);
    });
});
