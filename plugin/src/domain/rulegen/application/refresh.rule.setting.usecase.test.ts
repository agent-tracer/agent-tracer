import {RULE_GENERATION_SETTINGS_DEFAULT} from "@agent-tracer/kernel";
import {describe, expect, it} from "vitest";
import {RefreshRuleSettingUsecase} from "~plugin/domain/rulegen/application/refresh.rule.setting.usecase.js";
import {RuleGenerationSettingCache} from "~plugin/domain/rulegen/model/rule.command.model.js";
import {InMemoryRuleSetting} from "~plugin/domain/rulegen/port/__fakes__/in-memory.rule.setting.js";
import type {RuleSettingPort} from "~plugin/domain/rulegen/port/rule.setting.port.js";

describe("RefreshRuleSettingUsecase", () => {
    it("서버 설정의 규칙 상한을 캐시에 반영한다", async () => {
        const cache = new RuleGenerationSettingCache();

        expect(await new RefreshRuleSettingUsecase(new InMemoryRuleSetting({kind: "found", value: {maxRulesPerTask: 4, model: "claude-haiku-4-5", outputLanguage: "auto", effort: "high"}}), cache).execute()).toEqual({maxRulesPerTask: 4, model: "claude-haiku-4-5", outputLanguage: "auto", effort: "high"});
        expect(cache.snapshot().maxRulesPerTask).toBe(4);
    });

    it("설정을 읽지 못하면 직전 값을 지킨다", async () => {
        const cache = new RuleGenerationSettingCache();
        cache.replace({maxRulesPerTask: 3, model: "claude-sonnet-5", outputLanguage: "auto", effort: "high"});
        const failing: RuleSettingPort = {
            fetch: () => Promise.reject(new Error("unreachable")),
        };

        expect(await new RefreshRuleSettingUsecase(failing, cache).execute()).toEqual({maxRulesPerTask: 3, model: "claude-sonnet-5", outputLanguage: "auto", effort: "high"});
    });

    it("설정 응답이 비면 캐시를 갈아엎지 않는다", async () => {
        const cache = new RuleGenerationSettingCache();
        cache.replace({maxRulesPerTask: 3, model: "claude-sonnet-5", outputLanguage: "auto", effort: "high"});

        await new RefreshRuleSettingUsecase(new InMemoryRuleSetting({kind: "unavailable"}), cache).execute();

        expect(cache.snapshot().maxRulesPerTask).toBe(3);
        expect(cache.isSupported()).toBe(true);
    });

    it("설정 창구가 없다는 확답을 받으면 규칙 생성을 접는다", async () => {
        const cache = new RuleGenerationSettingCache();

        await new RefreshRuleSettingUsecase(new InMemoryRuleSetting({kind: "unsupported"}), cache).execute();

        expect(cache.isSupported()).toBe(false);
    });

    it("아무것도 못 읽었으면 계약의 기본값을 쓴다", () => {
        expect(new RuleGenerationSettingCache().snapshot()).toEqual(RULE_GENERATION_SETTINGS_DEFAULT);
    });
});
