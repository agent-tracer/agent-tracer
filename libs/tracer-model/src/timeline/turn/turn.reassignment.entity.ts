import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { timestampColumnType } from "@agent-tracer/platform";

/** 세션의 턴 축을 닫힌 구간으로 잘라 다른 태스크에 할당한 사용자 결정이며, 원장 밖에 있어 투영이 이 표를 읽어야 재투영을 견딘다. */
@Entity({ name: "turn_reassignments" })
@Index("turn_reassignments_session", ["userId", "sessionId", "fromTurnIndex"])
@Index("turn_reassignments_task", ["userId", "taskId"])
export class TurnReassignmentEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ name: "user_id", type: "text" })
    userId!: string;

    @Column({ name: "session_id", type: "text" })
    sessionId!: string;

    @Column({ name: "from_turn_index", type: "integer" })
    fromTurnIndex!: number;

    // 살아 있는 세션은 자르지 않으므로 구간의 끝은 언제나 정해져 있다.
    @Column({ name: "to_turn_index", type: "integer" })
    toTurnIndex!: number;

    @Column({ name: "task_id", type: "text" })
    taskId!: string;

    @Column({ name: "origin_task_id", type: "text" })
    originTaskId!: string;

    @Column({ name: "moved_at", type: timestampColumnType() })
    movedAt!: Date;

    static create(input: {
        readonly id: string;
        readonly userId: string;
        readonly sessionId: string;
        readonly fromTurnIndex: number;
        readonly toTurnIndex: number;
        readonly taskId: string;
        readonly originTaskId: string;
        readonly movedAt: Date;
    }): TurnReassignmentEntity {
        const row = new TurnReassignmentEntity();
        row.id = input.id;
        row.userId = input.userId;
        row.sessionId = input.sessionId;
        row.fromTurnIndex = input.fromTurnIndex;
        row.toTurnIndex = input.toTurnIndex;
        row.taskId = input.taskId;
        row.originTaskId = input.originTaskId;
        row.movedAt = input.movedAt;
        return row;
    }

    covers(turnIndex: number): boolean {
        return turnIndex >= this.fromTurnIndex && turnIndex <= this.toTurnIndex;
    }
}
