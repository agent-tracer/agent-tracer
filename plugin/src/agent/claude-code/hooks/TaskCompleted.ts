/** 태스크가 완료로 표시되면 Claude Code가 실행하는 훅이다. */
import {readTaskLifecycle} from "~plugin/agent/claude-code/payload/agent.payload.js";
import {claudeRuntime, resolveEventSession, runHook} from "~plugin/agent/claude-code/runtime.js";
import {onLifecycleEvent} from "~plugin/domain/ingest/inbound/tool.hook.js";
import {todoLifecycleEvent} from "~plugin/domain/ingest/model/todo.tool.model.js";

await runHook("TaskCompleted", {
    parse: readTaskLifecycle,
    handler: async (payload) => {
        const target = await resolveEventSession(payload.sessionId, payload.agentId, payload.agentType, payload.transcriptPath);
        await onLifecycleEvent(claudeRuntime.ingest, [
            todoLifecycleEvent(target, {
                taskName: payload.taskName,
                todoState: "completed",
                source: "TaskCompleted",
                status: "completed",
            }),
        ]);
    },
});
