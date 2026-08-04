import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { jsonColumnType } from "@agent-tracer/platform";

/** 파티션과 CDC가 없는 로컬 원장의 저장 스키마이며 seq는 투영이 읽는 단조 커서다. */
@Entity({ name: "events" })
@Index("events_task_seq", ["taskId", "seq"])
@Index("events_trace", ["traceId"])
export class LocalLedgerEventEntity {
    // 삽입 순서로 증가하며 투영이 이 값을 커서로 삼는다.
    @PrimaryGeneratedColumn({ name: "seq", type: "integer" })
    seq!: number;

    @Column({ type: "text", unique: true })
    id!: string;

    @Column({ name: "user_id", type: "text" })
    userId!: string;

    @Column({ name: "task_id", type: "text" })
    taskId!: string;

    @Column({ name: "session_id", type: "text", nullable: true })
    sessionId!: string | null;

    @Column({ type: "text" })
    kind!: string;

    // 원장을 다시 읽는 쪽이 방언별 시각 표기를 추측하지 않도록 ISO8601 문자열로 굳혀 적는다.
    @Column({ name: "occurred_at", type: "text" })
    occurredAt!: string;

    @Column({ name: "received_at", type: "text" })
    receivedAt!: string;

    @Column({ name: "trace_id", type: "text" })
    traceId!: string;

    @Column({ name: "span_id", type: "text" })
    spanId!: string;

    @Column({ name: "parent_span_id", type: "text", nullable: true })
    parentSpanId!: string | null;

    // 인제스트 요청을 손실 없이 되만들기 위해 트레이스로 접히기 전 원본을 함께 남긴다.
    @Column({ name: "turn_id", type: "text", nullable: true })
    turnId!: string | null;

    @Column({ name: "parent_id", type: "text", nullable: true })
    parentId!: string | null;

    @Column({ type: jsonColumnType() })
    payload!: Record<string, unknown>;
}
