import "reflect-metadata";
import { getMetadataArgsStorage } from "typeorm";
import { describe, expect, it } from "vitest";
import { AgentEventView } from "../timeline/event/agent.event.view.js";
import { AgentRuleView } from "../rule/agent.rule.view.js";
import { AgentTaskView } from "../task/agent.task.view.js";
import { AgentTurnView } from "../timeline/turn/agent.turn.view.js";

function columnNames(target: unknown): string[] {
    return getMetadataArgsStorage()
        .columns.filter((column) => column.target === target)
        .map((column) => column.options.name ?? column.propertyName)
        .sort();
}

// 이 목록은 다른 저장소가 읽는 공개 계약이며, 엔티티를 고치면 이 테스트가 먼저 깨진다.
describe("에이전트가 읽는 뷰의 공개 계약", () => {
    it("agent_task_view가 노출하는 열이 고정되어 있다", () => {
        expect(columnNames(AgentTaskView)).toEqual([
            "archived_at",
            "created_at",
            "hidden_at",
            "id",
            "last_event_at",
            "origin",
            "parent_task_id",
            "status",
            "task_kind",
            "title",
            "updated_at",
            "user_id",
            "workspace_path",
        ]);
    });

    it("agent_turn_view가 노출하는 열이 고정되어 있다", () => {
        expect(columnNames(AgentTurnView)).toEqual([
            "asked_text",
            "assistant_text",
            "id",
            "task_id",
            "turn_index",
            "user_id",
        ]);
    });

    it("agent_event_view가 노출하는 열이 고정되어 있다", () => {
        expect(columnNames(AgentEventView)).toEqual([
            "body",
            "file_paths",
            "id",
            "kind",
            "metadata",
            "occurred_at",
            "seq",
            "task_id",
            "title",
            "tool_name",
            "turn_id",
            "user_id",
        ]);
    });

    it("agent_rule_view가 노출하는 열이 고정되어 있다", () => {
        expect(columnNames(AgentRuleView)).toEqual([
            "anchor_event_id",
            "created_at",
            "expectation",
            "id",
            "name",
            "rationale",
            "severity",
            "signature",
            "source",
            "task_id",
            "user_id",
        ]);
    });
});
