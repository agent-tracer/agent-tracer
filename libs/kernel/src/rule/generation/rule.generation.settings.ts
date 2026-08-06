/** 규칙 생성 설정의 HTTP 계약이며 실행기와 화면이 같은 값을 읽는다. */
export const RULE_GENERATION_SETTINGS_PATH = "/api/v1/settings/rule-generation";

// 언어 목록은 계약이 갖는 값이라 생성 파일에서 그대로 다시 내보낸다.
export {
    RULE_GENERATION_LANGUAGE,
    RULE_GENERATION_LANGUAGES,
    RULE_GENERATION_LANGUAGE_FALLBACK,
    type RuleGenerationLanguage,
} from "./rule.generation.languages.js";
import { RULE_GENERATION_LANGUAGE_FALLBACK, type RuleGenerationLanguage } from "./rule.generation.languages.js";

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
    outputLanguage: RULE_GENERATION_LANGUAGE_FALLBACK,
    effort: RULE_GENERATION_EFFORT.high,
} as const;

/** 화면이 고치고 실행기가 읽는 규칙 생성 설정이다. */
export interface RuleGenerationSettingsDto {
    readonly maxRulesPerTask: number;
    readonly model: string;
    readonly outputLanguage: RuleGenerationLanguage;
    readonly effort: RuleGenerationEffort;
}
