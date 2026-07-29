import type {
    RuleGenerationSettingCache,
    RuleGenerationSettings,
} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";

/** 서버 설정을 읽어 규칙 생성 설정 캐시를 갱신하고, 읽지 못하면 직전 값을 지키며 창구가 없으면 규칙 생성을 제공하지 않는다. */
export class RefreshRuleSettingUsecase {
    constructor(
        private readonly settings: RuleSettingPort,
        private readonly cache: RuleGenerationSettingCache,
    ) {}

    async execute(): Promise<RuleGenerationSettings> {
        try {
            const fetched = await this.settings.fetch();
            if (fetched.kind === "found") this.cache.replace(fetched.value);
            else if (fetched.kind === "unsupported") this.cache.markUnsupported();
        } catch {
            return this.cache.snapshot();
        }
        return this.cache.snapshot();
    }
}
