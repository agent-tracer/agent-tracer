import {RULE_GENERATION_SETTINGS_PATH, type RuleGenerationSettingsDto} from "@agent-tracer/kernel";
import {getJson} from "~plugin/config/http.js";
import type {RuleGenerationSettings} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";
import type {Fetched} from "~plugin/support/fetched.js";

interface SettingsEnvelope {
    readonly data?: {readonly settings?: RuleGenerationSettingsDto};
}

/** 규칙 생성 설정을 이 저장소의 설정 창구에서 읽으며 에이전트 서비스와 무관하다. */
export class TracerRuleSettingAdapter implements RuleSettingPort {
    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
    ) {}

    async fetch(): Promise<Fetched<RuleGenerationSettings>> {
        const fetched = await getJson<SettingsEnvelope>(
            `${this.baseUrl}${RULE_GENERATION_SETTINGS_PATH}`,
            this.headers,
        );
        if (fetched.kind !== "found") return fetched;
        const settings = fetched.value.data?.settings;
        if (settings === undefined) return {kind: "unavailable"};
        return {
            kind: "found",
            value: {
                maxRulesPerTask: settings.maxRulesPerTask,
                model: settings.model,
                outputLanguage: settings.outputLanguage,
                effort: settings.effort,
            },
        };
    }
}
