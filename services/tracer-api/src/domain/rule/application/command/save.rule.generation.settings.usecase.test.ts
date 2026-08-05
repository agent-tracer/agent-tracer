import { describe, expect, it } from "vitest";
import { RULE_GENERATION_SETTINGS_DEFAULT } from "@agent-tracer/kernel";
import { RuleGenerationSettingsEntity } from "@agent-tracer/tracer-model";
import { FixedClock } from "~tracer-api/domain/rule/port/__fakes__/fixed.clock.js";
import type { RuleGenerationSettingsRepositoryPort } from "~tracer-api/domain/rule/port/rule.generation.settings.repository.port.js";
import { GENERATION_NOW } from "./rule.generation.fixture.js";
import { SaveRuleGenerationSettingsUseCase } from "./save.rule.generation.settings.usecase.js";

class InMemorySettings implements RuleGenerationSettingsRepositoryPort {
    private row: RuleGenerationSettingsEntity | null = null;

    async findByUser(userId: string): Promise<RuleGenerationSettingsEntity | null> {
        return this.row?.userId === userId ? this.row : null;
    }

    async upsert(settings: RuleGenerationSettingsEntity): Promise<void> {
        this.row = settings;
    }
}

function useCase(repo: InMemorySettings): SaveRuleGenerationSettingsUseCase {
    return new SaveRuleGenerationSettingsUseCase(repo, new FixedClock(GENERATION_NOW));
}

describe("SaveRuleGenerationSettingsUseCase", () => {
    it("저장한 적이 없으면 계약의 기본값을 낸다", async () => {
        const result = await useCase(new InMemorySettings()).read("u1");

        expect(result.settings).toEqual(RULE_GENERATION_SETTINGS_DEFAULT);
    });

    it("고친 값만 바꾸고 나머지는 그대로 둔다", async () => {
        const repo = new InMemorySettings();
        const settings = useCase(repo);

        await settings.save("u1", { model: "claude-opus-5", outputLanguage: "ko" });
        const result = await settings.save("u1", { maxRulesPerTask: 2 });

        expect(result.settings).toEqual({
            maxRulesPerTask: 2,
            model: "claude-opus-5",
            outputLanguage: "ko",
            effort: RULE_GENERATION_SETTINGS_DEFAULT.effort,
        });
    });

    it("비운 값은 기본으로 되돌린다", async () => {
        const repo = new InMemorySettings();
        const settings = useCase(repo);
        await settings.save("u1", { model: "claude-opus-5" });

        const result = await settings.save("u1", { model: null });

        expect(result.settings.model).toBe(RULE_GENERATION_SETTINGS_DEFAULT.model);
    });

    it("규칙 상한은 계약이 정한 값을 넘지 않는다", async () => {
        const repo = new InMemorySettings();
        const row = new RuleGenerationSettingsEntity();
        row.userId = "u1";
        row.maxRulesPerTask = 999;
        row.model = null;
        row.outputLanguage = null;
        row.effort = null;
        row.updatedAt = GENERATION_NOW;
        await repo.upsert(row);

        const result = await useCase(repo).read("u1");

        expect(result.settings.maxRulesPerTask).toBe(20);
    });
});
