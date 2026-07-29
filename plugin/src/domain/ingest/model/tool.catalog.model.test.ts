import {KIND} from "@agent-tracer/kernel";
import {describe, expect, it} from "vitest";
import type {ToolCall} from "~plugin/domain/ingest/model/tool.call.model.js";
import {shapeToolEvent, toolCategoryOf} from "~plugin/domain/ingest/model/tool.catalog.model.js";

const CONTEXT = {projectDir: "/repo"};

function shape(toolName: string, toolInput: Record<string, unknown> = {}) {
    const call: ToolCall = {toolName, toolInput};
    return shapeToolEvent(call, CONTEXT);
}

describe("toolCategoryOf", () => {
    it.each([
        ["Bash", "terminal"],
        ["PowerShell", "terminal"],
        ["BashOutput", "background_shell"],
        ["KillShell", "background_shell"],
        ["Monitor", "monitor"],
        ["Read", "explore"],
        ["Grep", "explore"],
        ["WebSearch", "explore"],
        ["LSP", "lsp"],
        ["ToolSearch", "tool_search"],
        ["Edit", "file"],
        ["NotebookEdit", "file"],
        ["Agent", "agent"],
        ["Skill", "skill"],
        ["mcp__linear__create_issue", "mcp"],
        ["CronCreate", "cron"],
        ["EnterWorktree", "mode_change"],
        ["ExitPlanMode", "plan"],
        ["AskUserQuestion", "question"],
    ])("%s를 %s 도구군으로 분류한다", (toolName, category) => {
        expect(toolCategoryOf(toolName)).toBe(category);
    });

    it("모르는 도구는 도구군이 없다", () => {
        expect(toolCategoryOf("Unknown")).toBeUndefined();
    });
});

describe("shapeToolEvent 라우팅", () => {
    it("LSP를 코드 인텔리전스 탐색 이벤트로 만든다", () => {
        const shaped = shape("LSP", {operation: "definition", symbol: "foo"});
        expect(shaped?.kind).toBe(KIND.executeTool);
        expect(shaped?.lane).toBe("exploration");
        expect(shaped?.title).toBe("LSP definition: foo");
    });

    it("ToolSearch를 탐색 이벤트로 만든다", () => {
        expect(shape("ToolSearch", {query: "slack"})?.lane).toBe("exploration");
    });

    it("BashOutput과 KillShell을 배경 셸 이벤트로 만든다", () => {
        expect(shape("BashOutput", {bash_id: "sh-1"})?.title).toBe("BashOutput: sh-1");
        expect(shape("KillShell", {bash_id: "sh-1"})?.title).toBe("KillShell: sh-1");
    });

    it("ExitPlanMode를 계획 이벤트로 만든다", () => {
        expect(shape("ExitPlanMode", {plan: "step"})?.kind).toBe(KIND.planLogged);
    });

    it("AskUserQuestion을 질문 이벤트로 만든다", () => {
        expect(shape("AskUserQuestion", {question: "why"})?.kind).toBe(KIND.questionLogged);
    });

    it("Cron 도구를 coordination 이벤트로 만든다", () => {
        expect(shape("CronCreate", {schedule: "0 0 * * *"})?.kind).toBe(KIND.invokeAgent);
    });

    it("mode change 도구를 컨텍스트 이벤트로 만든다", () => {
        expect(shape("EnterWorktree", {path: "/wt"})?.kind).toBe(KIND.contextSaved);
    });

    it("모르는 도구는 조형하지 않는다", () => {
        expect(shape("Unknown")).toBeNull();
    });
});
