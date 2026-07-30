import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitTracerModel1785300000000 implements MigrationInterface {
    name = "InitTracerModel1785300000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "task_cleanup_suggestions" ("id" text NOT NULL, "user_id" text NOT NULL, "job_id" text NOT NULL, "task_id" text NOT NULL, "kind" text NOT NULL, "current_value" text, "proposed_value" text, "rationale" text NOT NULL, "status" text NOT NULL, "error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "resolved_at" TIMESTAMP WITH TIME ZONE, "observed_last_event_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8e8c3972c249e3e775df23eae2b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "cleanup_pending_task_kind_unique" ON "task_cleanup_suggestions" ("user_id", "task_id", "kind") WHERE "status" = 'pending'`);
        await queryRunner.query(`CREATE INDEX "cleanup_user_status" ON "task_cleanup_suggestions" ("user_id", "status", "created_at") `);
        await queryRunner.query(`CREATE TABLE "daemon_health" ("user_id" text NOT NULL, "spool_backlog_bytes" integer NOT NULL, "dead_letter_count" integer NOT NULL, "last_dead_reasons" jsonb NOT NULL DEFAULT '[]', "swallowed_errors" integer NOT NULL, "daemon_version" text NOT NULL, "retry_status_since" TIMESTAMP WITH TIME ZONE, "reported_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_20b10c66bcddf05a7c233bec941" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "memos" ("id" text NOT NULL, "user_id" text NOT NULL, "task_id" text NOT NULL, "event_id" text, "body" text NOT NULL, "author" text NOT NULL, "last_edited_by" text NOT NULL, "rev" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_5f005ade603ff6ea114dcacde0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "memos_live_user_task" ON "memos" ("user_id", "task_id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "memos_event" ON "memos" ("event_id") WHERE "event_id" IS NOT NULL AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "memos_user_task" ON "memos" ("user_id", "task_id") `);
        await queryRunner.query(`CREATE TABLE "recipe_applications" ("id" text NOT NULL, "user_id" text NOT NULL, "recipe_id" text NOT NULL, "task_id" text NOT NULL, "injected_via" text NOT NULL, "outcome" text, "note" text, "anchor_event_id" text, "anchor_seq" bigint, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_70bf3aa8844f7792c6dec92c7ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "recipe_applications_task" ON "recipe_applications" ("task_id") `);
        await queryRunner.query(`CREATE INDEX "recipe_applications_recipe" ON "recipe_applications" ("recipe_id", "created_at") `);
        await queryRunner.query(`CREATE TABLE "recipes" ("id" text NOT NULL, "user_id" text NOT NULL, "status" text NOT NULL, "title" text NOT NULL, "intent" text NOT NULL, "description" text NOT NULL, "summary_md" text NOT NULL, "request" text NOT NULL DEFAULT '', "corrections" jsonb NOT NULL DEFAULT '[]', "pitfalls" jsonb NOT NULL DEFAULT '[]', "governing_rules" jsonb NOT NULL DEFAULT '[]', "steps" jsonb NOT NULL DEFAULT '[]', "touched_files" jsonb NOT NULL DEFAULT '[]', "contributing_slices" jsonb NOT NULL DEFAULT '[]', "rationale" text, "language" text, "rev" integer NOT NULL DEFAULT '1', "parent_recipe_id" text, "source_job_id" text, "user_edited" boolean NOT NULL DEFAULT false, "last_edited_by" text NOT NULL DEFAULT 'agent', "error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "resolved_at" TIMESTAMP WITH TIME ZONE, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8f09680a51bf3669c1598a21682" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "recipes_live_user_status" ON "recipes" ("user_id", "status", "updated_at") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "recipes_user_status" ON "recipes" ("user_id", "status", "updated_at") `);
        await queryRunner.query(`CREATE TABLE "rules" ("id" text NOT NULL, "user_id" text NOT NULL, "name" text NOT NULL, "expectation" jsonb NOT NULL DEFAULT '{}', "task_id" text NOT NULL, "source" text NOT NULL, "severity" text NOT NULL, "rationale" text, "signature" text NOT NULL, "user_edited" boolean NOT NULL DEFAULT false, "review_state" text NOT NULL DEFAULT 'active', "last_edited_by" text NOT NULL DEFAULT 'agent', "rev" integer NOT NULL DEFAULT '1', "source_job_id" text, "anchor_event_id" text NOT NULL, "cited_turn_ids" jsonb NOT NULL DEFAULT '[]', "cited_event_ids" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_10fef696a7d61140361b1b23608" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "rules_live_user_task" ON "rules" ("user_id", "task_id") WHERE "review_state" = 'active' AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "rules_anchor_event" ON "rules" ("anchor_event_id") `);
        await queryRunner.query(`CREATE INDEX "rules_signature" ON "rules" ("user_id", "signature") `);
        await queryRunner.query(`CREATE INDEX "rules_user_task" ON "rules" ("user_id", "task_id") `);
        await queryRunner.query(`CREATE TABLE "verdicts" ("rule_id" text NOT NULL, "turn_id" text NOT NULL, "status" text NOT NULL, "severity" text NOT NULL, "nudge_count" integer NOT NULL DEFAULT '0', "evidence" jsonb NOT NULL DEFAULT '{}', "evaluated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_evaluated_seq" text, CONSTRAINT "PK_e25657217794135c688d2379760" PRIMARY KEY ("rule_id"))`);
        await queryRunner.query(`CREATE INDEX "verdicts_turn" ON "verdicts" ("turn_id") `);
        await queryRunner.query(`CREATE TABLE "search_outbox" ("id" text NOT NULL, "user_id" text NOT NULL, "target" text NOT NULL, "target_id" text NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "last_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_f0e10017d6287176243c2926453" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "search_outbox_created" ON "search_outbox" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" text NOT NULL, "user_id" text NOT NULL, "task_id" text NOT NULL, "runtime_source" text NOT NULL, "runtime_session_id" text NOT NULL, "status" text NOT NULL, "summary" text, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ended_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "sessions_user_task" ON "sessions" ("user_id", "task_id", "started_at") `);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" text NOT NULL, "user_id" text NOT NULL, "title" text NOT NULL, "title_rank" text NOT NULL DEFAULT 'auto', "slug" text NOT NULL, "workspace_path" text, "status" text NOT NULL, "task_kind" text NOT NULL, "origin" text NOT NULL, "cli_source" text, "parent_task_id" text, "parent_session_id" text, "background_of_task_id" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_session_started_at" TIMESTAMP WITH TIME ZONE, "last_event_at" TIMESTAMP WITH TIME ZONE, "last_applied_seq" bigint, CONSTRAINT "PK_e5598b50e5aff20056c6d6acd08" PRIMARY KEY ("id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "tasks_parent" ON "tasks" ("parent_task_id") `);
        await queryRunner.query(`CREATE INDEX "tasks_user_updated" ON "tasks" ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE TABLE "task_user_state" ("task_id" text NOT NULL, "user_id" text NOT NULL, "archived_at" TIMESTAMP WITH TIME ZONE, "hidden_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_a08e5ad8d0d725aa2bdf72856a5" PRIMARY KEY ("task_id", "user_id"))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" text NOT NULL, "user_id" text NOT NULL, "name" text NOT NULL, "color" text NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "tags_live_user" ON "tags" ("user_id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "tags_user_name" ON "tags" ("user_id", "name") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "task_tags" ("id" text NOT NULL, "user_id" text NOT NULL, "task_id" text NOT NULL, "tag_id" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_7b47a7628547c0976415988d3cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "task_tags_tag" ON "task_tags" ("user_id", "tag_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "task_tags_unique" ON "task_tags" ("user_id", "task_id", "tag_id") `);
        await queryRunner.query(`CREATE TABLE "events" ("id" text NOT NULL, "seq" bigint NOT NULL, "user_id" text NOT NULL, "task_id" text NOT NULL, "session_id" text, "turn_id" text, "kind" text NOT NULL, "lane" text NOT NULL, "title" text NOT NULL DEFAULT '', "body" text, "tool_name" text, "file_paths" jsonb NOT NULL DEFAULT '[]', "metadata" jsonb NOT NULL DEFAULT '{}', "trace_id" text NOT NULL, "span_id" text NOT NULL, "parent_span_id" text, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "events_trace" ON "events" ("trace_id") `);
        await queryRunner.query(`CREATE INDEX "events_turn" ON "events" ("turn_id") `);
        await queryRunner.query(`CREATE INDEX "events_user_task_seq" ON "events" ("user_id", "task_id", "seq") `);
        await queryRunner.query(`CREATE TABLE "turns" ("id" text NOT NULL, "user_id" text NOT NULL, "session_id" text NOT NULL, "task_id" text NOT NULL, "turn_index" integer NOT NULL, "status" text NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ended_at" TIMESTAMP WITH TIME ZONE, "asked_text" text, "assistant_text" text, "aggregate_verdict" text, "rules_evaluated_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_66edaea493f45e3c39d7c3553ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "turns_session_index" ON "turns" ("session_id", "turn_index") `);
        await queryRunner.query(`CREATE INDEX "turns_user_task" ON "turns" ("user_id", "task_id", "turn_index") `);
        await queryRunner.query(`CREATE TABLE "users" ("user_id" text NOT NULL, "email" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "task_cleanup_suggestions"`);
        await queryRunner.query(`DROP INDEX "public"."cleanup_pending_task_kind_unique"`);
        await queryRunner.query(`DROP INDEX "public"."cleanup_user_status"`);
        await queryRunner.query(`DROP TABLE "daemon_health"`);
        await queryRunner.query(`DROP TABLE "memos"`);
        await queryRunner.query(`DROP INDEX "public"."memos_live_user_task"`);
        await queryRunner.query(`DROP INDEX "public"."memos_event"`);
        await queryRunner.query(`DROP INDEX "public"."memos_user_task"`);
        await queryRunner.query(`DROP TABLE "recipe_applications"`);
        await queryRunner.query(`DROP INDEX "public"."recipe_applications_task"`);
        await queryRunner.query(`DROP INDEX "public"."recipe_applications_recipe"`);
        await queryRunner.query(`DROP TABLE "recipes"`);
        await queryRunner.query(`DROP INDEX "public"."recipes_live_user_status"`);
        await queryRunner.query(`DROP INDEX "public"."recipes_user_status"`);
        await queryRunner.query(`DROP TABLE "rules"`);
        await queryRunner.query(`DROP INDEX "public"."rules_live_user_task"`);
        await queryRunner.query(`DROP INDEX "public"."rules_anchor_event"`);
        await queryRunner.query(`DROP INDEX "public"."rules_signature"`);
        await queryRunner.query(`DROP INDEX "public"."rules_user_task"`);
        await queryRunner.query(`DROP TABLE "verdicts"`);
        await queryRunner.query(`DROP INDEX "public"."verdicts_turn"`);
        await queryRunner.query(`DROP TABLE "search_outbox"`);
        await queryRunner.query(`DROP INDEX "public"."search_outbox_created"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."sessions_user_task"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP INDEX "public"."tasks_parent"`);
        await queryRunner.query(`DROP INDEX "public"."tasks_user_updated"`);
        await queryRunner.query(`DROP TABLE "task_user_state"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP INDEX "public"."tags_live_user"`);
        await queryRunner.query(`DROP INDEX "public"."tags_user_name"`);
        await queryRunner.query(`DROP TABLE "task_tags"`);
        await queryRunner.query(`DROP INDEX "public"."task_tags_tag"`);
        await queryRunner.query(`DROP INDEX "public"."task_tags_unique"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP INDEX "public"."events_trace"`);
        await queryRunner.query(`DROP INDEX "public"."events_turn"`);
        await queryRunner.query(`DROP INDEX "public"."events_user_task_seq"`);
        await queryRunner.query(`DROP TABLE "turns"`);
        await queryRunner.query(`DROP INDEX "public"."turns_session_index"`);
        await queryRunner.query(`DROP INDEX "public"."turns_user_task"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
