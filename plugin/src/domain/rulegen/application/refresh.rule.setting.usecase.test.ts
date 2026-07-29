import {describe, expect, it} from "vitest";
import {RefreshRuleSettingUsecase} from "~plugin/domain/rulegen/application/refresh.rule.setting.usecase.js";
import {RULE_GENERATION_MAX_RULES, RuleGenerationSettingCache} from "~plugin/domain/rulegen/model/rule.command.model.js";
import {InMemoryRuleSetting} from "~plugin/domain/rulegen/port/__fakes__/in-memory.rule.setting.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";

describe("RefreshRuleSettingUsecase", () => {
    it("서버 설정의 규칙 상한을 캐시에 반영한다", async () => {
        const cache = new RuleGenerationSettingCache();

        expect(await new RefreshRuleSettingUsecase(new InMemoryRuleSetting({maxRulesPerTask: 4, model: "claude-haiku-4-5"}), cache).execute()).toEqual({maxRulesPerTask: 4, model: "claude-haiku-4-5"});
        expect(cache.snapshot().maxRulesPerTask).toBe(4);
    });

    it("설정을 읽지 못하면 직전 값을 지킨다", async () => {
        const cache = new RuleGenerationSettingCache();
        cache.replace({maxRulesPerTask: 3, model: null});
        const failing: RuleSettingPort = {
            fetch: () => Promise.reject(new Error("unreachable")),
        };

        expect(await new RefreshRuleSettingUsecase(failing, cache).execute()).toEqual({maxRulesPerTask: 3, model: null});
    });

    it("설정 응답이 비면 캐시를 갈아엎지 않는다", async () => {
        const cache = new RuleGenerationSettingCache();
        cache.replace({maxRulesPerTask: 3, model: null});

        await new RefreshRuleSettingUsecase(new InMemoryRuleSetting(null), cache).execute();

        expect(cache.snapshot().maxRulesPerTask).toBe(3);
    });

    it("아무것도 못 읽었으면 기본 상한을 쓴다", () => {
        expect(new RuleGenerationSettingCache().snapshot().maxRulesPerTask).toBe(RULE_GENERATION_MAX_RULES);
    });
});
