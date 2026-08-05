import { Inject, Injectable } from "@nestjs/common";
import {
    RULE_GENERATION_MAX_RULES_LIMIT,
    RULE_GENERATION_SETTINGS_DEFAULT,
    type RuleGenerationEffort,
    type RuleGenerationLanguage,
    type RuleGenerationSettingsDto,
} from "@agent-tracer/kernel";
import { RuleGenerationSettingsEntity } from "@agent-tracer/tracer-model";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import {
    RULE_GENERATION_SETTINGS_REPOSITORY,
    type RuleGenerationSettingsRepositoryPort,
} from "~tracer-api/domain/rule/port/rule.generation.settings.repository.port.js";

/** 비운 값은 계약의 기본으로 되돌린다. */
export interface RuleGenerationSettingsPatch {
    readonly maxRulesPerTask?: number | null;
    readonly model?: string | null;
    readonly outputLanguage?: RuleGenerationLanguage | null;
    readonly effort?: RuleGenerationEffort | null;
}

function resolve(row: RuleGenerationSettingsEntity | null): RuleGenerationSettingsDto {
    return {
        maxRulesPerTask: Math.min(
            row?.maxRulesPerTask ?? RULE_GENERATION_SETTINGS_DEFAULT.maxRulesPerTask,
            RULE_GENERATION_MAX_RULES_LIMIT,
        ),
        model: row?.model ?? RULE_GENERATION_SETTINGS_DEFAULT.model,
        outputLanguage: row?.outputLanguage ?? RULE_GENERATION_SETTINGS_DEFAULT.outputLanguage,
        effort: row?.effort ?? RULE_GENERATION_SETTINGS_DEFAULT.effort,
    };
}

/** 규칙 생성 설정을 읽고 고치며 에이전트 서비스와 무관하게 이 저장소가 소유한다. */
@Injectable()
export class SaveRuleGenerationSettingsUseCase {
    constructor(
        @Inject(RULE_GENERATION_SETTINGS_REPOSITORY)
        private readonly settings: RuleGenerationSettingsRepositoryPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
    ) {}

    async read(userId: string): Promise<{ readonly settings: RuleGenerationSettingsDto }> {
        return { settings: resolve(await this.settings.findByUser(userId)) };
    }

    async save(
        userId: string,
        patch: RuleGenerationSettingsPatch,
    ): Promise<{ readonly settings: RuleGenerationSettingsDto }> {
        const current = await this.settings.findByUser(userId);
        const row = new RuleGenerationSettingsEntity();
        row.userId = userId;
        row.maxRulesPerTask = pick(patch, "maxRulesPerTask", current?.maxRulesPerTask ?? null);
        row.model = pick(patch, "model", current?.model ?? null);
        row.outputLanguage = pick(patch, "outputLanguage", current?.outputLanguage ?? null);
        row.effort = pick(patch, "effort", current?.effort ?? null);
        row.updatedAt = this.clock.now();
        await this.settings.upsert(row);
        return { settings: resolve(row) };
    }
}

function pick<K extends keyof RuleGenerationSettingsPatch>(
    patch: RuleGenerationSettingsPatch,
    key: K,
    current: NonNullable<RuleGenerationSettingsPatch[K]> | null,
): NonNullable<RuleGenerationSettingsPatch[K]> | null {
    const value = patch[key];
    return value === undefined ? current : value;
}
