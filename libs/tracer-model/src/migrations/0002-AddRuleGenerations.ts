import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRuleGenerations1785400000000 implements MigrationInterface {
    name = "AddRuleGenerations1785400000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rule_generations" ("id" text NOT NULL, "user_id" text NOT NULL, "task_id" text NOT NULL, "anchor_event_id" text NOT NULL, "intent" text, "max_rules" integer, "status" text NOT NULL DEFAULT 'pending', "lease_owner" text, "lease_expires_at" TIMESTAMP WITH TIME ZONE, "observation" jsonb NOT NULL DEFAULT '{"model":null,"costUsd":null,"numTurns":null,"durationMs":null,"inputTokens":null,"outputTokens":null,"cacheReadTokens":null,"cacheCreationTokens":null}', "steps" jsonb NOT NULL DEFAULT '[]', "skipped" jsonb NOT NULL DEFAULT '[]', "created_rule_ids" jsonb NOT NULL DEFAULT '[]', "error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE, "finished_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_rule_generations_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "rule_generations_active_anchor" ON "rule_generations" ("user_id", "anchor_event_id") WHERE "status" IN ('pending', 'running')`);
        await queryRunner.query(`CREATE INDEX "rule_generations_user_task" ON "rule_generations" ("user_id", "task_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "rule_generations_user_status" ON "rule_generations" ("user_id", "status", "created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "rule_generations_user_status"`);
        await queryRunner.query(`DROP INDEX "rule_generations_user_task"`);
        await queryRunner.query(`DROP INDEX "rule_generations_active_anchor"`);
        await queryRunner.query(`DROP TABLE "rule_generations"`);
    }
}
