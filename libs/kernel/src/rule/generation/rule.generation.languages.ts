// contract/agent/shared/languages.json 에서 만든 파일이라 손으로 고치지 않는다.

/** 규칙 이름과 근거를 쓸 언어이며 값은 계약이 갖는다. */
export const RULE_GENERATION_LANGUAGE = {
    auto: "auto",
    ko: "ko",
    en: "en",
    ja: "ja",
    zh: "zh",
} as const;

export type RuleGenerationLanguage = (typeof RULE_GENERATION_LANGUAGE)[keyof typeof RULE_GENERATION_LANGUAGE];

export const RULE_GENERATION_LANGUAGES: readonly RuleGenerationLanguage[] = [
    RULE_GENERATION_LANGUAGE.auto,
    RULE_GENERATION_LANGUAGE.ko,
    RULE_GENERATION_LANGUAGE.en,
    RULE_GENERATION_LANGUAGE.ja,
    RULE_GENERATION_LANGUAGE.zh,
];

/** 고르지 않았거나 계약이 모르는 값일 때 쓰는 언어다. */
export const RULE_GENERATION_LANGUAGE_FALLBACK: RuleGenerationLanguage = RULE_GENERATION_LANGUAGE.auto;
