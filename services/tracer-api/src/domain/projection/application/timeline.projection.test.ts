import { describe, expect, it } from "vitest";
import { KIND } from "@agent-tracer/kernel";
import { AGENT_TRACER_ATTR } from "@agent-tracer/kernel";
import {
    EventRepository,
    TurnReassignmentEntity,
    TurnRepository,
    type EventEntity,
    type TurnEntity,
} from "@agent-tracer/tracer-model";
import { asRepository, createInMemoryRepository } from "@agent-tracer/tracer-model/__fixtures__/in-memory-repository.js";
import { TimelineProjection } from "./timeline.projection.js";
import type { TimelineProjectionRepositories } from "~tracer-api/domain/projection/port/projection.repositories.port.js";
import type { LedgerRecord } from "~tracer-api/support/ledger.record.js";

function makeRepositories(reassignments: readonly TurnReassignmentEntity[] = []) {
    const eventsFake = createInMemoryRepository<EventEntity>();
    const turnsFake = createInMemoryRepository<TurnEntity>();
    const events = new EventRepository(asRepository(eventsFake));
    const turns = new TurnRepository(asRepository(turnsFake));
    const repositories = {
        events,
        turns,
        findReassignments: (_userId: string, sessionId: string) =>
            Promise.resolve(reassignments.filter((row) => row.sessionId === sessionId)),
        findEventById: (id: string) => Promise.resolve(eventsFake.all().find((e) => e.id === id) ?? null),
        findRunningAsyncAction: (taskId: string, asyncTaskId: string) =>
            Promise.resolve(
                eventsFake
                    .all()
                    .filter(
                        (e) =>
                            e.taskId === taskId
                            && e.kind === KIND.actionLogged
                            && e.metadata[AGENT_TRACER_ATTR.asyncTaskId] === asyncTaskId
                            && e.metadata[AGENT_TRACER_ATTR.asyncStatus] === "running",
                    )
                    .sort((a, b) => Number(b.seq) - Number(a.seq))[0] ?? null,
            ),
    } as unknown as TimelineProjectionRepositories;
    return { repositories, eventsFake, turnsFake };
}

function makeRecord(overrides: Partial<LedgerRecord> = {}): LedgerRecord {
    return {
        id: "event-1",
        seq: "1",
        userId: "u1",
        taskId: "task-1",
        sessionId: "session-1",
        kind: KIND.userMessage,
        occurredAt: new Date("2026-01-01T00:00:00.000Z"),
        receivedAt: new Date("2026-01-01T00:00:00.000Z"),
        traceId: "0123456789abcdef0123456789abcdef",
        spanId: "0123456789abcdef",
        parentSpanId: null,
        payload: {},
        ...overrides,
    };
}

describe("TimelineProjection", () => {
    it("사용자 메시지를 처음 소비하면 새 턴을 열고 이벤트에 turnId를 부여한다", async () => {
        const { repositories, eventsFake } = makeRepositories();
        const projection = new TimelineProjection();
        const result = await projection.project(repositories, makeRecord(), true);
        expect(result.event.turnId).not.toBeNull();
        expect(eventsFake.all()).toHaveLength(1);
    });

    it("같은 CDC 레코드를 두 번 소비해도(재전달) 같은 turnId로 수렴하고 턴을 다시 조립하지 않는다", async () => {
        const { repositories, eventsFake, turnsFake } = makeRepositories();
        const projection = new TimelineProjection();
        const record = makeRecord();

        const first = await projection.project(repositories, record, true);
        const turnCountAfterFirst = turnsFake.all().length;

        const second = await projection.project(repositories, record, true);

        expect(second.event.turnId).toBe(first.event.turnId);
        expect(turnsFake.all()).toHaveLength(turnCountAfterFirst);
        expect(eventsFake.all()).toHaveLength(1);
    });

    it("assemble이 false면 턴 조립 없이 이벤트만 저장한다", async () => {
        const { repositories, eventsFake } = makeRepositories();
        const projection = new TimelineProjection();
        const result = await projection.project(repositories, makeRecord(), false);
        expect(result.event.turnId).toBeNull();
        expect(eventsFake.all()).toHaveLength(1);
    });

    it("sessionId가 없으면 턴을 조립하지 않는다", async () => {
        const { repositories } = makeRepositories();
        const projection = new TimelineProjection();
        const result = await projection.project(repositories, makeRecord({ sessionId: null }), true);
        expect(result.event.turnId).toBeNull();
    });

    it("어시스턴트 응답을 소비하면 열린 턴을 닫는다", async () => {
        const { repositories } = makeRepositories();
        const projection = new TimelineProjection();
        await projection.project(repositories, makeRecord({ id: "event-1", kind: KIND.userMessage }), true);
        const closeResult = await projection.project(
            repositories,
            makeRecord({ id: "event-2", kind: KIND.assistantResponse }),
            true,
        );
        expect(closeResult.closedTurn).not.toBeNull();
        expect(closeResult.closedTurn?.isOpen()).toBe(false);
    });

    it("중간 어시스턴트 발화를 턴에 붙이고 최종 응답에서만 닫는다", async () => {
        const { repositories } = makeRepositories();
        const projection = new TimelineProjection();
        await projection.project(repositories, makeRecord({ id: "event-1", kind: KIND.userMessage }), true);

        const commentary = await projection.project(
            repositories,
            makeRecord({ id: "event-2", kind: KIND.assistantCommentary }),
            true,
        );
        const response = await projection.project(
            repositories,
            makeRecord({ id: "event-3", kind: KIND.assistantResponse }),
            true,
        );

        expect(commentary.event.turnId).not.toBeNull();
        expect(commentary.closedTurn).toBeNull();
        expect(response.event.turnId).toBe(commentary.event.turnId);
        expect(response.closedTurn?.isOpen()).toBe(false);
    });

    it("최종 응답보다 늦게 도착한 중간 발화를 부모 응답의 닫힌 턴에 붙인다", async () => {
        const { repositories } = makeRepositories();
        const projection = new TimelineProjection();
        await projection.project(repositories, makeRecord({ id: "event-1", kind: KIND.userMessage }), true);
        const response = await projection.project(
            repositories,
            makeRecord({ id: "event-2", kind: KIND.assistantResponse }),
            true,
        );

        const commentary = await projection.project(
            repositories,
            makeRecord({
                id: "event-3",
                kind: KIND.assistantCommentary,
                payload: { metadata: { [AGENT_TRACER_ATTR.turnResponseEventId]: "event-2" } },
            }),
            true,
        );

        expect(response.closedTurn?.id).not.toBeUndefined();
        expect(commentary.event.turnId).toBe(response.closedTurn?.id);
        expect(commentary.closedTurn).toBeNull();
    });

    it("최종 응답이 아닌 이벤트는 중간 발화의 턴 상관키로 사용하지 않는다", async () => {
        const { repositories } = makeRepositories();
        const projection = new TimelineProjection();
        await projection.project(repositories, makeRecord({ id: "event-1", kind: KIND.userMessage }), true);
        await projection.project(repositories, makeRecord({ id: "event-2", kind: KIND.executeTool }), true);
        await projection.project(repositories, makeRecord({ id: "event-3", kind: KIND.assistantResponse }), true);

        const commentary = await projection.project(
            repositories,
            makeRecord({
                id: "event-4",
                kind: KIND.assistantCommentary,
                payload: { metadata: { [AGENT_TRACER_ATTR.turnResponseEventId]: "event-2" } },
            }),
            true,
        );

        expect(commentary.event.turnId).toBeNull();
    });

    it("백그라운드 서브에이전트 완료 이벤트는 도착 시점 열린 턴이 아니라 위임이 시작된 턴에 붙는다", async () => {
        const { repositories } = makeRepositories();
        const projection = new TimelineProjection();

        const seq1 = await projection.project(
            repositories,
            makeRecord({ id: "event-1", seq: "1", kind: KIND.userMessage }),
            true,
        );
        const originTurnId = seq1.event.turnId;

        await projection.project(
            repositories,
            makeRecord({
                id: "event-2",
                seq: "2",
                kind: KIND.actionLogged,
                payload: { metadata: { [AGENT_TRACER_ATTR.asyncTaskId]: "agent-1", [AGENT_TRACER_ATTR.asyncStatus]: "running" } },
            }),
            true,
        );
        await projection.project(
            repositories,
            makeRecord({ id: "event-3", seq: "3", kind: KIND.assistantResponse }),
            true,
        );
        // 다음 턴이 이미 열린 뒤에야 백그라운드 서브에이전트가 완료된다.
        await projection.project(
            repositories,
            makeRecord({ id: "event-4", seq: "4", kind: KIND.userMessage }),
            true,
        );
        const completed = await projection.project(
            repositories,
            makeRecord({
                id: "event-5",
                seq: "5",
                kind: KIND.actionLogged,
                payload: { metadata: { [AGENT_TRACER_ATTR.asyncTaskId]: "agent-1", [AGENT_TRACER_ATTR.asyncStatus]: "completed" } },
            }),
            true,
        );

        expect(completed.event.turnId).toBe(originTurnId);
    });
});

describe("TimelineProjection 턴 분리 재할당", () => {
    function reassignment(from: number, to: number, taskId: string): TurnReassignmentEntity {
        return TurnReassignmentEntity.create({
            id: `r-${from}-${to}`,
            userId: "u1",
            sessionId: "session-1",
            fromTurnIndex: from,
            toTurnIndex: to,
            taskId,
            originTaskId: "task-1",
            movedAt: new Date("2026-01-01T00:00:00.000Z"),
        });
    }

    it("구간에 든 턴과 그 이벤트는 옮겨 간 태스크로 투영된다", async () => {
        const { repositories, turnsFake } = makeRepositories([reassignment(1, 1, "t2")]);
        const projection = new TimelineProjection();

        const opened = await projection.project(
            repositories,
            makeRecord({ id: "event-1", seq: "1", kind: KIND.userMessage }),
            true,
        );

        expect(opened.event.taskId).toBe("t2");
        expect(turnsFake.all()[0]?.taskId).toBe("t2");
    });

    it("구간 밖의 턴은 원래 태스크에 남는다", async () => {
        const { repositories, turnsFake } = makeRepositories([reassignment(2, 3, "t2")]);
        const projection = new TimelineProjection();

        const opened = await projection.project(
            repositories,
            makeRecord({ id: "event-1", seq: "1", kind: KIND.userMessage }),
            true,
        );

        expect(opened.event.taskId).toBe("task-1");
        expect(turnsFake.all()[0]?.taskId).toBe("task-1");
    });

    // 재할당을 투영이 읽지 않으면 CDC가 같은 배치를 다시 보낼 때 분리가 되돌아간다.
    it("같은 원장 레코드를 다시 투영해도 분리가 유지된다", async () => {
        const { repositories, turnsFake } = makeRepositories([reassignment(1, 1, "t2")]);
        const projection = new TimelineProjection();
        const record = makeRecord({ id: "event-1", seq: "1", kind: KIND.userMessage });

        await projection.project(repositories, record, true);
        const replayed = await projection.project(repositories, record, true);

        expect(replayed.event.taskId).toBe("t2");
        expect(turnsFake.all().every((turn) => turn.taskId === "t2")).toBe(true);
    });
});
