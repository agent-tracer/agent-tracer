/** 규칙 생성 설정의 HTTP 계약이며 실행기와 화면이 같은 값을 읽는다. */
export const RULE_GENERATION_SETTINGS_PATH = "/api/v1/settings/rule-generation";

/** 규칙 이름과 근거를 쓸 언어이며 auto는 요구가 쓰인 언어를 따른다. */
export const RULE_GENERATION_LANGUAGE = {
    auto: "auto",
    ko: "ko",
    en: "en",
    ja: "ja",
    zh: "zh",
} as const;

export type RuleGenerationLanguage = (typeof RULE_GENERATION_LANGUAGE)[keyof typeof RULE_GENERATION_LANGUAGE];

export const RULE_GENERATION_LANGUAGES: readonly RuleGenerationLanguage[] = Object.values(RULE_GENERATION_LANGUAGE);

/** 모델이 답 하나에 들이는 추론의 양이다. */
export const RULE_GENERATION_EFFORT = {
    low: "low",
    medium: "medium",
    high: "high",
    xhigh: "xhigh",
    max: "max",
} as const;

export type RuleGenerationEffort = (typeof RULE_GENERATION_EFFORT)[keyof typeof RULE_GENERATION_EFFORT];

export const RULE_GENERATION_EFFORTS: readonly RuleGenerationEffort[] = Object.values(RULE_GENERATION_EFFORT);

/** 설정이 비었을 때 실행기가 쓰는 값이다. */
export const RULE_GENERATION_SETTINGS_DEFAULT = {
    maxRulesPerTask: 5,
    model: "claude-sonnet-5",
    outputLanguage: RULE_GENERATION_LANGUAGE.auto,
    effort: RULE_GENERATION_EFFORT.high,
} as const;

/** 화면이 고치고 실행기가 읽는 규칙 생성 설정이다. */
export interface RuleGenerationSettingsDto {
    readonly maxRulesPerTask: number;
    readonly model: string;
    readonly outputLanguage: RuleGenerationLanguage;
    readonly effort: RuleGenerationEffort;
}
