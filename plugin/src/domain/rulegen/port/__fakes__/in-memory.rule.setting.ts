import type {RuleGenerationSettings} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";
import type {Fetched} from "~plugin/support/fetched.js";

/** 규칙 생성 설정 포트의 인메모리 대역이다. */
export class InMemoryRuleSetting implements RuleSettingPort {
    constructor(private readonly result: Fetched<RuleGenerationSettings> = {kind: "unavailable"}) {}

    async fetch(): Promise<Fetched<RuleGenerationSettings>> {
        return this.result;
    }
}
