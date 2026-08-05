import {APP_SETTING_KEYS} from "@agent-tracer/kernel/settings/setting.const.js";
import {NO_AGENT_BACKEND, withAgentBackend, type AgentBackendPort} from "~plugin/config/agent.backend.js";
import {getJson} from "~plugin/config/http.js";
import {
    parseMaxRulesPerTask,
    type RuleGenerationSettings,
} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";
import type {Fetched} from "~plugin/support/fetched.js";

interface SettingsEnvelope {
    readonly data?: {readonly items?: readonly {readonly key: string; readonly maskedValue: string}[]};
}

/** 서버 설정 목록에서 이 데몬의 규칙 생성기가 쓰는 값만 뽑는다. */
export class HttpRuleSettingAdapter implements RuleSettingPort {
    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
        private readonly backend: AgentBackendPort = NO_AGENT_BACKEND,
    ) {}

    async fetch(): Promise<Fetched<RuleGenerationSettings>> {
        const url = withAgentBackend(`${this.baseUrl}/api/agent/settings`, await this.backend.current());
        const fetched = await getJson<SettingsEnvelope>(url, this.headers);
        if (fetched.kind !== "found") return fetched;
        const items = fetched.value.data?.items;
        if (items === undefined) return {kind: "unavailable"};
        const maxRules = items.find((item) => item.key === APP_SETTING_KEYS.ruleGenMaxRulesPerTask);
        const model = items.find((item) => item.key === APP_SETTING_KEYS.anthropicModel);
        return {
            kind: "found",
            value: {
                maxRulesPerTask: parseMaxRulesPerTask(maxRules?.maskedValue),
                model: model?.maskedValue.trim() || null,
            },
        };
    }
}
