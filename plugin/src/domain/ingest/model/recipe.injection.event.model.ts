import type {RecipeInjectedVia} from "@agent-tracer/kernel/ingest/event.kind.const.js";
import {KIND} from "~plugin/domain/ingest/model/event.model.js";
import type {IngestTarget} from "~plugin/domain/ingest/model/event.model.js";
import type {RunEventInput} from "~plugin/domain/ingest/model/ingest.event.model.js";

/** get_recipe 호출로 레시피 적용이 열린 사실이며 applicationId가 그 적용의 식별자다. */
export interface RecipeInjectionInput {
    readonly recipeId: string;
    readonly applicationId: string;
    readonly injectedVia: RecipeInjectedVia;
}

export function recipeInjectedEvent(
    target: IngestTarget,
    input: RecipeInjectionInput,
): RunEventInput {
    return {
        kind: KIND.recipeInjected,
        taskId: target.taskId,
        sessionId: target.sessionId,
        ...(target.turnId ? {turnId: target.turnId} : {}),
        payload: {
            recipeId: input.recipeId,
            applicationId: input.applicationId,
            injectedVia: input.injectedVia,
        },
    };
}
