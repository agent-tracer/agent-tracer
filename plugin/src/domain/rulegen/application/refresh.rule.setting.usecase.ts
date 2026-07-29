import type {
    RuleGenerationSettingCache,
    RuleGenerationSettings,
} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";

/** 서버 설정을 읽어 규칙 생성 설정 캐시를 갱신하고 읽지 못하면 직전 값을 지킨다. */
export class RefreshRuleSettingUsecase {
    constructor(
        private readonly settings: RuleSettingPort,
        private readonly cache: RuleGenerationSettingCache,
    ) {}

    async execute(): Promise<RuleGenerationSettings> {
        try {
            const fetched = await this.settings.fetch();
            if (fetched !== null) this.cache.replace(fetched);
        } catch {
            return this.cache.snapshot();
        }
        return this.cache.snapshot();
    }
}
