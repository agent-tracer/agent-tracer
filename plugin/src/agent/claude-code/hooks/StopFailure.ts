/** API 오류로 턴이 끝나면 Claude Code가 실행하는 훅이다. */
import {readStopFailure} from "~plugin/agent/claude-code/payload/turn.payload.js";
import {claudeRuntime, resolveEventSession, runHook} from "~plugin/agent/claude-code/runtime.js";
import {onLifecycleEvent} from "~plugin/domain/ingest/inbound/tool.hook.js";
import {turnFailedEvent} from "~plugin/domain/ingest/model/message.event.model.js";

await runHook("StopFailure", {
    parse: readStopFailure,
    handler: async (payload) => {
        const target = await resolveEventSession(payload.sessionId, payload.agentId, payload.agentType, payload.transcriptPath);
        await onLifecycleEvent(claudeRuntime.ingest, [
            turnFailedEvent(target, {
                messageId: claudeRuntime.ids.next(),
                errorType: payload.errorType,
                ...(payload.errorMessage !== undefined ? {errorMessage: payload.errorMessage} : {}),
                runtimeSource: claudeRuntime.runtimeSource,
            }),
        ]);
    },
});
