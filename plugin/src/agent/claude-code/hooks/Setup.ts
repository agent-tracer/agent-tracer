/** Claude Code가 초기화나 유지보수 모드로 호출되면 실행되는 훅이다. */
import {readSetup} from "~plugin/agent/claude-code/payload/workspace.payload.js";
import {claudeRuntime, resolveEventSession, runHook} from "~plugin/agent/claude-code/runtime.js";
import {onLifecycleEvent} from "~plugin/domain/ingest/inbound/tool.hook.js";
import {setupEvent} from "~plugin/domain/ingest/model/lifecycle.event.model.js";

await runHook("Setup", {
    parse: readSetup,
    handler: async (payload) => {
        const target = await resolveEventSession(payload.sessionId, payload.agentId, payload.agentType, payload.transcriptPath);
        await onLifecycleEvent(claudeRuntime.ingest, [setupEvent(target, payload.trigger)]);
    },
});
