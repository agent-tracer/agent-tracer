import { Column, Entity, PrimaryColumn } from "typeorm";
import { timestampColumnType } from "@agent-tracer/platform";
import type { RuleGenerationEffort, RuleGenerationLanguage } from "@agent-tracer/kernel";

@Entity({ name: "rule_generation_settings" })
export class RuleGenerationSettingsEntity {
    @PrimaryColumn({ name: "user_id", type: "text" })
    userId!: string;

    /** 비어 있으면 실행기가 계약의 기본값을 쓴다. */
    @Column({ name: "max_rules_per_task", type: "integer", nullable: true })
    maxRulesPerTask!: number | null;

    @Column({ type: "text", nullable: true })
    model!: string | null;

    @Column({ name: "output_language", type: "text", nullable: true })
    outputLanguage!: RuleGenerationLanguage | null;

    @Column({ type: "text", nullable: true })
    effort!: RuleGenerationEffort | null;

    @Column({ name: "updated_at", type: timestampColumnType() })
    updatedAt!: Date;
}
