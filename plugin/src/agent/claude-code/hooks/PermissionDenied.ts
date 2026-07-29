/** 자동 모드 분류기가 도구 호출을 거부하면 Claude Code가 실행하는 훅이다. */
import {readPermissionDenied} from "~plugin/agent/claude-code/payload/tool.payload.js";
import {claudeRuntime, resolveEventSession, runHook} from "~plugin/agent/claude-code/runtime.js";
import {onLifecycleEvent} from "~plugin/domain/ingest/inbound/tool.hook.js";
import {permissionDeniedEvent} from "~plugin/domain/ingest/model/workspace.event.model.js";

await runHook("PermissionDenied", {
    parse: readPermissionDenied,
    handler: async (payload) => {
        const target = await resolveEventSession(payload.sessionId, payload.agentId, payload.agentType, payload.transcriptPath);
        await onLifecycleEvent(claudeRuntime.ingest, [
            permissionDeniedEvent(target, payload.toolName, payload.toolInput, payload.toolUseId),
        ]);
    },
});
