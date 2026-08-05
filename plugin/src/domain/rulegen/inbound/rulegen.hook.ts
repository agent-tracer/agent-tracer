import type {RequestRuleGenerationUsecase} from "~plugin/domain/rulegen/application/request.rule.generation.usecase.js";
import type {PollRuleGenerationsUsecase} from "~plugin/domain/rulegen/application/poll.rule.generations.usecase.js";
import type {RefreshRuleSettingUsecase} from "~plugin/domain/rulegen/application/refresh.rule.setting.usecase.js";
import type {RuleGenerationSettings} from "~plugin/domain/rulegen/model/rule.command.model.js";

/** 규칙 생성 도메인이 데몬에 제공하는 진입점 묶음이다. */
export interface RulegenHook {
    readonly pollGenerations: PollRuleGenerationsUsecase;
    readonly refreshSetting: RefreshRuleSettingUsecase;
    readonly requestGeneration: RequestRuleGenerationUsecase;
}

export function onRuleGenerationPoll(hook: RulegenHook): Promise<void> {
    return hook.pollGenerations.execute();
}

export function hasRunningRuleGenerationJobs(hook: RulegenHook): boolean {
    return hook.pollGenerations.hasRunning();
}

export function releaseRunningRuleGenerationJobs(hook: RulegenHook): Promise<void> {
    return hook.pollGenerations.releaseRunning();
}

export function onRuleGenerationSettingRefresh(hook: RulegenHook): Promise<RuleGenerationSettings> {
    return hook.refreshSetting.execute();
}

export function onUserInputForRuleGeneration(
    hook: RulegenHook,
    kind: string,
    taskId: string,
    eventId: string,
    prompt: string,
): Promise<void> {
    return hook.requestGeneration.execute(kind, taskId, eventId, prompt);
}
