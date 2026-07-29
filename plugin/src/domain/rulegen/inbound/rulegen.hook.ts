import type {EnqueueRuleJobUsecase} from "~plugin/domain/rulegen/application/enqueue.rule.job.usecase.js";
import type {PollRuleJobsUsecase} from "~plugin/domain/rulegen/application/poll.rule.jobs.usecase.js";
import type {RefreshRuleSettingUsecase} from "~plugin/domain/rulegen/application/refresh.rule.setting.usecase.js";
import type {RuleGenerationSettings} from "~plugin/domain/rulegen/model/rule.command.model.js";

/** 규칙 생성 도메인이 데몬에 제공하는 진입점 묶음이다. */
export interface RulegenHook {
    readonly pollJobs: PollRuleJobsUsecase;
    readonly refreshSetting: RefreshRuleSettingUsecase;
    readonly enqueueRuleJob: EnqueueRuleJobUsecase;
}

export function onRuleGenerationPoll(hook: RulegenHook): Promise<void> {
    return hook.pollJobs.execute();
}

export function hasRunningRuleGenerationJobs(hook: RulegenHook): boolean {
    return hook.pollJobs.hasRunning();
}

export function releaseRunningRuleGenerationJobs(hook: RulegenHook): Promise<void> {
    return hook.pollJobs.releaseRunning();
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
    return hook.enqueueRuleJob.execute(kind, taskId, eventId, prompt);
}
