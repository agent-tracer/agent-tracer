import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { timestampColumnType } from "@agent-tracer/platform";
import {
    AUTO_TITLE_RANK,
    COMPLETED_TASK_STATUS,
    TITLE_RANKS,
    USER_TASK_ORIGIN,
    USER_TITLE_RANK,
    type MonitoringTaskKind,
    type TaskOrigin,
    type TaskStatus,
    type TitleRank,
} from "@agent-tracer/kernel";
import { deriveTaskSlug } from "./task.slug.js";

const TITLE_RANK_ORDER: Readonly<Record<TitleRank, number>> = Object.fromEntries(
    TITLE_RANKS.map((rank, index) => [rank, index]),
) as Record<TitleRank, number>;

/** 태스크 읽기 모델의 상태와 원장 적용 순서를 관리한다. */
@Entity({ name: "tasks" })
@Index("tasks_user_updated", ["userId", "updatedAt"])
@Index("tasks_parent", ["parentTaskId"])
export class TaskEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @PrimaryColumn({ name: "user_id", type: "text" })
    userId!: string;

    @Column({ type: "text" })
    title!: string;

    @Column({ name: "title_rank", type: "text", default: AUTO_TITLE_RANK })
    titleRank!: TitleRank;

    @Column({ type: "text" })
    slug!: string;

    @Column({ name: "workspace_path", type: "text", nullable: true })
    workspacePath!: string | null;

    @Column({ type: "text" })
    status!: TaskStatus;

    @Column({ name: "task_kind", type: "text" })
    taskKind!: MonitoringTaskKind;

    @Column({ type: "text" })
    origin!: TaskOrigin;

    @Column({ name: "cli_source", type: "text", nullable: true })
    cliSource!: string | null;

    @Column({ name: "parent_task_id", type: "text", nullable: true })
    parentTaskId!: string | null;

    @Column({ name: "parent_session_id", type: "text", nullable: true })
    parentSessionId!: string | null;

    @Column({ name: "background_of_task_id", type: "text", nullable: true })
    backgroundOfTaskId!: string | null;

    // 턴 분리로 갈라져 나온 태스크가 원본을 가리키며, 서브에이전트 계보인 parentTaskId를 재사용하지 않는다.
    @Column({ name: "split_from_task_id", type: "text", nullable: true })
    splitFromTaskId!: string | null;

    @Column({ name: "created_at", type: timestampColumnType() })
    createdAt!: Date;

    @Column({ name: "updated_at", type: timestampColumnType() })
    updatedAt!: Date;

    @Column({ name: "last_session_started_at", type: timestampColumnType(), nullable: true })
    lastSessionStartedAt!: Date | null;

    @Column({ name: "last_event_at", type: timestampColumnType(), nullable: true })
    lastEventAt!: Date | null;

    @Column({ name: "last_applied_seq", type: "bigint", nullable: true })
    lastAppliedSeq!: string | null;

    /** 턴 분리가 만드는 태스크이며, 원장 레코드의 taskId로 등장하지 않아 투영이 이 행을 만들거나 덮지 않는다. */
    static splitFrom(id: string, origin: TaskEntity, title: string, at: Date): TaskEntity {
        const task = new TaskEntity();
        task.id = id;
        task.userId = origin.userId;
        task.title = title;
        task.titleRank = USER_TITLE_RANK;
        task.slug = deriveTaskSlug(title);
        task.workspacePath = origin.workspacePath;
        // 끝난 세션의 턴만 옮겨 오므로 이 태스크는 열린 채로 태어나지 않는다.
        task.status = COMPLETED_TASK_STATUS;
        task.taskKind = origin.taskKind;
        task.origin = USER_TASK_ORIGIN;
        task.cliSource = origin.cliSource;
        task.parentTaskId = null;
        task.parentSessionId = null;
        task.backgroundOfTaskId = null;
        task.splitFromTaskId = origin.id;
        task.createdAt = at;
        task.updatedAt = at;
        task.lastSessionStartedAt = null;
        task.lastEventAt = null;
        task.lastAppliedSeq = null;
        return task;
    }

    applyLedgerStatusEffect(status: TaskStatus, at: Date, seq: string): boolean {
        if (this.isStaleSeq(seq)) return false;
        this.lastAppliedSeq = seq;
        const changed = this.status !== status;
        this.status = status;
        this.updatedAt = at;
        return changed;
    }

    forceStatus(status: TaskStatus, at: Date): boolean {
        const changed = this.status !== status;
        this.status = status;
        this.updatedAt = at;
        return changed;
    }

    /** 들어오는 제목의 순위가 저장된 순위보다 낮으면 무시하고, 그 이상이면 제목과 순위를 함께 갱신한다. */
    applyRankedTitle(title: string, rank: TitleRank, at: Date): boolean {
        if (TITLE_RANK_ORDER[rank] < TITLE_RANK_ORDER[this.titleRank]) return false;
        this.title = title;
        this.slug = deriveTaskSlug(title);
        this.titleRank = rank;
        this.updatedAt = at;
        return true;
    }

    isStaleSeq(seq: string): boolean {
        const applied = this.lastAppliedSeq ?? null;
        return applied !== null && BigInt(seq) <= BigInt(applied);
    }

    recordEventArrival(at: Date): void {
        if (this.lastEventAt === null || at.getTime() > this.lastEventAt.getTime()) {
            this.lastEventAt = at;
        }
    }

    recordSessionStart(at: Date): void {
        if (this.lastSessionStartedAt === null || at.getTime() > this.lastSessionStartedAt.getTime()) {
            this.lastSessionStartedAt = at;
        }
    }

    isCompleted(): boolean {
        return this.status === COMPLETED_TASK_STATUS;
    }

    isSessionRecipeScanAnchor(): boolean {
        return this.origin === USER_TASK_ORIGIN && this.parentTaskId === null;
    }

    isRecipeScanAnchor(): boolean {
        return this.isSessionRecipeScanAnchor() && this.isCompleted();
    }

    isOwnedBy(userId: string): boolean {
        return this.userId === userId;
    }

    hasActivitySince(observedAt: Date | null): boolean {
        if (this.lastEventAt === null) return false;
        if (observedAt === null) return true;
        return this.lastEventAt.getTime() > observedAt.getTime();
    }
}
