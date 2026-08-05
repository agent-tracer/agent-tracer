import {
    isRuleGenerationTrigger,
    type RuleGenerationSettingCache,
} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {RulegenLogPort} from "~plugin/domain/rulegen/port/log.port.js";
import type {RuleGenerationPort} from "~plugin/domain/rulegen/port/rule.generation.port.js";

/** 규칙 생성을 부르는 사용자 입력마다 태스크당 하나의 요청을 넣는다. */
export class RequestRuleGenerationUsecase {
    constructor(
        private readonly requests: RuleGenerationPort,
        private readonly cache: RuleGenerationSettingCache,
        private readonly log: RulegenLogPort,
    ) {}

    async execute(kind: string, taskId: string, eventId: string, prompt: string): Promise<void> {
        if (!isRuleGenerationTrigger(kind, taskId, eventId, prompt)) return;
        if (!this.cache.isSupported()) return;
        try {
            if (await this.requests.hasActiveRequest(taskId)) return;
            await this.requests.enqueue(taskId, eventId, this.cache.snapshot().maxRulesPerTask);
        } catch (error) {
            this.log.write(`request failed for task ${taskId}: ${String(error)}`);
        }
    }
}
