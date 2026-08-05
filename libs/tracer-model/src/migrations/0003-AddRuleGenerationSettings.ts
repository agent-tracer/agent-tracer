import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRuleGenerationSettings1785500000000 implements MigrationInterface {
    name = "AddRuleGenerationSettings1785500000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rule_generation_settings" ("user_id" text NOT NULL, "max_rules_per_task" integer, "model" text, "output_language" text, "effort" text, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_rule_generation_settings_user" PRIMARY KEY ("user_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "rule_generation_settings"`);
    }
}
