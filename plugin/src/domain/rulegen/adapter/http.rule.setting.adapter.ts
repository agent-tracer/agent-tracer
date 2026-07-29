import {APP_SETTING_KEYS} from "@agent-tracer/kernel/settings/setting.const.js";
import {getJson} from "~plugin/config/http.js";
import {
    parseMaxRulesPerTask,
    type RuleGenerationSettings,
} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";

interface SettingsEnvelope {
    readonly data?: {readonly items?: readonly {readonly key: string; readonly maskedValue: string}[]};
}

/** 서버 설정 목록에서 이 데몬의 규칙 생성기가 쓰는 값만 뽑는다. */
export class HttpRuleSettingAdapter implements RuleSettingPort {
    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
    ) {}

    async fetch(): Promise<RuleGenerationSettings | null> {
        const fetched = await getJson<SettingsEnvelope>(`${this.baseUrl}/api/v1/settings`, this.headers);
        const items = fetched.kind === "found" ? fetched.value.data?.items : undefined;
        if (items === undefined) return null;
        const maxRules = items.find((item) => item.key === APP_SETTING_KEYS.ruleGenMaxRulesPerTask);
        const model = items.find((item) => item.key === APP_SETTING_KEYS.anthropicModel);
        return {
            maxRulesPerTask: parseMaxRulesPerTask(maxRules?.maskedValue),
            model: model?.maskedValue.trim() || null,
        };
    }
}
