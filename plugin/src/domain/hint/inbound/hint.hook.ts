import type {ComputeHintsUsecase} from "~plugin/domain/hint/application/compute.hints.usecase.js";
import type {PreprocessingHint, PreprocessingHintsRequest} from "~plugin/domain/hint/model/hint.model.js";
import type {RecentEvent} from "~plugin/domain/ingest/model/recent.event.model.js";

/** 힌트 도메인이 어댑터에 제공하는 진입점 묶음이다. */
export interface HintHook {
    readonly computeHints: ComputeHintsUsecase;
}

export function onHintsRequested(
    hook: HintHook,
    recent: readonly RecentEvent[],
    request: PreprocessingHintsRequest,
): PreprocessingHint[] {
    return hook.computeHints.execute(recent, request);
}
