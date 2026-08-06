import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecipeApplicability1785700000000 implements MigrationInterface {
    name = "AddRecipeApplicability1785700000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipes" ADD "use_when" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "recipes" ADD "inputs" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "recipes" ADD "outputs" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "recipes" ADD "recovery" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipes" DROP COLUMN "recovery"`);
        await queryRunner.query(`ALTER TABLE "recipes" DROP COLUMN "outputs"`);
        await queryRunner.query(`ALTER TABLE "recipes" DROP COLUMN "inputs"`);
        await queryRunner.query(`ALTER TABLE "recipes" DROP COLUMN "use_when"`);
    }
}
