import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { jsonColumnDefault, jsonColumnType, timestampColumnType } from "@agent-tracer/platform";
import {
    EMPTY_RULE_GENERATION_OBSERVATION,
    RULE_GENERATION_STATUS,
    type RuleGenerationObservation,
    type RuleGenerationStatus,
} from "@agent-tracer/kernel";

/** 실행기가 남긴 궤적 한 단계다. */
export interface RuleGenerationStep {
    readonly seq: number;
    readonly role: string;
    readonly content: string;
    readonly toolName?: string | undefined;
}

@Entity({ name: "rule_generations" })
@Index("rule_generations_user_status", ["userId", "status", "createdAt"])
@Index("rule_generations_user_task", ["userId", "taskId", "createdAt"])
// 같은 앵커로 도는 요청이 둘이면 같은 요구에 두 번 청구되므로 살아 있는 동안은 하나만 둔다.
@Index("rule_generations_active_anchor", ["userId", "anchorEventId"], {
    unique: true,
    where: "\"status\" IN ('pending', 'running')",
})
export class RuleGenerationEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ name: "user_id", type: "text" })
    userId!: string;

    @Column({ name: "task_id", type: "text" })
    taskId!: string;

    /** 규칙이 검증할 사용자 입력이며 판정 창이 여기서 시작한다. */
    @Column({ name: "anchor_event_id", type: "text" })
    anchorEventId!: string;

    @Column({ type: "text", nullable: true })
    intent!: string | null;

    @Column({ name: "max_rules", type: "integer", nullable: true })
    maxRules!: number | null;

    @Column({ type: "text", default: RULE_GENERATION_STATUS.pending })
    status!: RuleGenerationStatus;

    /** 리스를 쥔 실행기이며 회수된 요청을 리스를 잃은 실행기가 종결시키지 못하게 한다. */
    @Column({ name: "lease_owner", type: "text", nullable: true })
    leaseOwner!: string | null;

    @Column({ name: "lease_expires_at", type: timestampColumnType(), nullable: true })
    leaseExpiresAt!: Date | null;

    @Column({ type: jsonColumnType(), default: jsonColumnDefault(EMPTY_RULE_GENERATION_OBSERVATION) })
    observation!: RuleGenerationObservation;

    @Column({ type: jsonColumnType(), default: jsonColumnDefault([]) })
    steps!: RuleGenerationStep[];

    /** 근거가 서지 않아 버린 제안의 사유다. */
    @Column({ type: jsonColumnType(), default: jsonColumnDefault([]) })
    skipped!: string[];

    @Column({ name: "created_rule_ids", type: jsonColumnType(), default: jsonColumnDefault([]) })
    createdRuleIds!: string[];

    @Column({ type: "text", nullable: true })
    error!: string | null;

    @Column({ name: "created_at", type: timestampColumnType() })
    createdAt!: Date;

    @Column({ name: "started_at", type: timestampColumnType(), nullable: true })
    startedAt!: Date | null;

    @Column({ name: "finished_at", type: timestampColumnType(), nullable: true })
    finishedAt!: Date | null;
}
