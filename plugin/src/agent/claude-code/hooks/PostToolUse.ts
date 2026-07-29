/** 도구 호출이 성공하면 Claude Code가 실행하는 훅이며 도구별 matcher가 모두 이 엔트리로 들어와 도메인 조형에 위임한다. */
import {readPostToolUse} from "~plugin/agent/claude-code/payload/tool.payload.js";
import {
    claudeRuntime,
    ensureBackgroundSession,
    resolveEventSession,
    runHook,
} from "~plugin/agent/claude-code/runtime.js";
import {onTodoTool, onToolUse} from "~plugin/domain/ingest/inbound/tool.hook.js";
import {CHILD_TITLE_MAX, readChildSessionId} from "~plugin/domain/ingest/model/coordination.tool.model.js";
import {AGENT_TOOL_NAME} from "~plugin/domain/ingest/model/event.model.js";
import {TODO_TOOLS} from "~plugin/domain/ingest/model/todo.tool.model.js";
import type {ToolCall} from "~plugin/domain/ingest/model/tool.call.model.js";
import {defaultTaskTitle} from "~plugin/domain/ingest/model/workspace.path.model.js";
import {subagentSessionId} from "~plugin/domain/session/model/session.event.model.js";
import {toBoolean, toTrimmedString} from "~plugin/support/text.js";

const TODO_TOOL_NAMES: ReadonlySet<string> = new Set(TODO_TOOLS);

await runHook("PostToolUse", {
    parse: readPostToolUse,
    handler: async (payload) => {
        const target = await resolveEventSession(payload.sessionId, payload.agentId, payload.agentType, payload.transcriptPath);
        const call: ToolCall = {
            toolName: payload.toolName,
            toolInput: payload.toolInput,
            toolResponse: payload.toolResponse,
            ...(payload.toolUseId !== undefined ? {toolUseId: payload.toolUseId} : {}),
        };

        if (TODO_TOOL_NAMES.has(call.toolName)) {
            const runtimeSessionId = payload.agentId !== undefined
                ? subagentSessionId(payload.agentId)
                : payload.sessionId;
            await onTodoTool(claudeRuntime.ingest, call, target, runtimeSessionId);
            return;
        }

        await onToolUse(claudeRuntime.ingest, call, target);

        if (call.toolName !== AGENT_TOOL_NAME) return;
        if (!toBoolean(call.toolInput["run_in_background"])) return;
        const childSessionId = readChildSessionId(call.toolResponse);
        if (!childSessionId) return;

        const description = toTrimmedString(call.toolInput["description"]);
        const prompt = toTrimmedString(call.toolInput["prompt"], CHILD_TITLE_MAX);
        await ensureBackgroundSession(
            target,
            childSessionId,
            description || prompt || defaultTaskTitle(claudeRuntime.projectDir),
        );
    },
});
