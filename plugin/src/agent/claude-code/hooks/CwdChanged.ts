/** 작업 디렉터리가 바뀌면 Claude Code가 실행하는 훅이다. */
import {readCwdChanged} from "~plugin/agent/claude-code/payload/workspace.payload.js";
import {claudeRuntime, resolveEventSession, runHook} from "~plugin/agent/claude-code/runtime.js";
import {onLifecycleEvent} from "~plugin/domain/ingest/inbound/tool.hook.js";
import {cwdChangedEvent} from "~plugin/domain/ingest/model/lifecycle.event.model.js";

await runHook("CwdChanged", {
    parse: readCwdChanged,
    handler: async (payload) => {
        const target = await resolveEventSession(payload.sessionId, payload.agentId, payload.agentType, payload.transcriptPath);
        await onLifecycleEvent(claudeRuntime.ingest, [
            cwdChangedEvent(target, payload.oldCwd, payload.newCwd),
        ]);
    },
});
