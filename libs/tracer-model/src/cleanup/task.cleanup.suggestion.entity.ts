import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { timestampColumnType } from "@agent-tracer/platform";
import {
    CLEANUP_SUGGESTION_STATUS,
    type TaskCleanupSuggestionKind,
    type TaskCleanupSuggestionStatus,
} from "@agent-tracer/kernel";
import { InvariantViolationError } from "../error/invariant.error.js";

export interface TaskCleanupSuggestionPendingInput {
    readonly id: string;
    readonly userId: string;
    readonly jobId: string;
    readonly taskId: string;
    readonly kind: TaskCleanupSuggestionKind;
    readonly rationale: string;
    readonly observedLastEventAt: Date | null;
}

export interface TaskCleanupSuggestionRestateInput {
    readonly jobId: string;
    readonly rationale: string;
    readonly observedLastEventAt: Date | null;
}

@Entity({ name: "task_cleanup_suggestions" })
@Index("cleanup_user_status", ["userId", "status", "createdAt"])
@Index("cleanup_pending_task_kind_unique", ["userId", "taskId", "kind"], {
    unique: true,
    where: "\"status\" = 'pending'",
})
export class TaskCleanupSuggestionEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ name: "user_id", type: "text" })
    userId!: string;

    @Column({ name: "job_id", type: "text" })
    jobId!: string;

    @Column({ name: "task_id", type: "text" })
    taskId!: string;

    @Column({ type: "text" })
    kind!: TaskCleanupSuggestionKind;

    @Column({ name: "current_value", type: "text", nullable: true })
    currentValue!: string | null;

    @Column({ name: "proposed_value", type: "text", nullable: true })
    proposedValue!: string | null;

    @Column({ type: "text" })
    rationale!: string;

    @Column({ type: "text" })
    status!: TaskCleanupSuggestionStatus;

    @Column({ type: "text", nullable: true })
    error!: string | null;

    @Column({ name: "created_at", type: timestampColumnType() })
    createdAt!: Date;

    @Column({ name: "resolved_at", type: timestampColumnType(), nullable: true })
    resolvedAt!: Date | null;

    // 제안을 만들 때 서버가 관찰한 대상 태스크의 마지막 이벤트 시각이며, 수락 시점에 태스크가
    // 그 뒤로 새 활동을 겪었는지 비교하는 기준값이다.
    @Column({ name: "observed_last_event_at", type: timestampColumnType(), nullable: true })
    observedLastEventAt!: Date | null;

    static pending(input: TaskCleanupSuggestionPendingInput, now: Date): TaskCleanupSuggestionEntity {
        const row = new TaskCleanupSuggestionEntity();
        row.id = input.id;
        row.userId = input.userId;
        row.jobId = input.jobId;
        row.taskId = input.taskId;
        row.kind = input.kind;
        row.currentValue = null;
        row.proposedValue = null;
        row.rationale = input.rationale;
        row.status = CLEANUP_SUGGESTION_STATUS.pending;
        row.error = null;
        row.createdAt = now;
        row.resolvedAt = null;
        row.observedLastEventAt = input.observedLastEventAt;
        return row;
    }

    /** 같은 태스크와 종류의 대기 행은 하나뿐이므로 새 근거와 새 관측 시각을 그 행에 겹쳐 적는다. */
    restate(input: TaskCleanupSuggestionRestateInput): void {
        if (this.status !== CLEANUP_SUGGESTION_STATUS.pending) throw new InvariantViolationError("cleanup.not-pending");
        this.jobId = input.jobId;
        this.rationale = input.rationale;
        this.observedLastEventAt = input.observedLastEventAt;
    }

    isOwnedBy(userId: string): boolean {
        return this.userId === userId;
    }

    isAccepted(): boolean {
        return this.status === CLEANUP_SUGGESTION_STATUS.accepted;
    }

    accept(now: Date): void {
        // 대기 중인 제안만 수락할 수 있다.
        if (this.status !== CLEANUP_SUGGESTION_STATUS.pending) throw new InvariantViolationError("cleanup.not-pending");
        this.status = CLEANUP_SUGGESTION_STATUS.accepted;
        this.resolvedAt = now;
    }

    dismiss(now: Date): void {
        // 대기 중인 제안만 기각할 수 있다.
        if (this.status !== CLEANUP_SUGGESTION_STATUS.pending) throw new InvariantViolationError("cleanup.not-pending");
        this.status = CLEANUP_SUGGESTION_STATUS.dismissed;
        this.resolvedAt = now;
    }
}
