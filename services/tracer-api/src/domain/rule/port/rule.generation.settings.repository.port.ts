import type { RuleGenerationSettingsEntity } from "@agent-tracer/tracer-model";

export const RULE_GENERATION_SETTINGS_REPOSITORY = Symbol("RuleGenerationSettingsRepository");

/** 규칙 생성 설정의 조회와 저장을 제공하는 애플리케이션 포트다. */
export interface RuleGenerationSettingsRepositoryPort {
    findByUser(userId: string): Promise<RuleGenerationSettingsEntity | null>;
    upsert(settings: RuleGenerationSettingsEntity): Promise<void>;
}
