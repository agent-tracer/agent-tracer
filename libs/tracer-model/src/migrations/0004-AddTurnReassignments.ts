import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddTurnReassignments1785600000000 implements MigrationInterface {
    name = "AddTurnReassignments1785600000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "turn_reassignments" ("id" text NOT NULL, "user_id" text NOT NULL, "session_id" text NOT NULL, "from_turn_index" integer NOT NULL, "to_turn_index" integer NOT NULL, "task_id" text NOT NULL, "origin_task_id" text NOT NULL, "moved_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_turn_reassignments_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "turn_reassignments_session" ON "turn_reassignments" ("user_id", "session_id", "from_turn_index")`);
        await queryRunner.query(`CREATE INDEX "turn_reassignments_task" ON "turn_reassignments" ("user_id", "task_id")`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "split_from_task_id" text`);
        await queryRunner.query(`CREATE INDEX "tasks_split_from" ON "tasks" ("split_from_task_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "tasks_split_from"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "split_from_task_id"`);
        await queryRunner.query(`DROP INDEX "turn_reassignments_task"`);
        await queryRunner.query(`DROP INDEX "turn_reassignments_session"`);
        await queryRunner.query(`DROP TABLE "turn_reassignments"`);
    }
}
