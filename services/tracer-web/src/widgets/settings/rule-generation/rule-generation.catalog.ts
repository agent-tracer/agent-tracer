import { APP_SETTING_KEYS } from "@agent-tracer/kernel";

export const RULE_GENERATION_SETTING_KEYS = {
  apiKey: APP_SETTING_KEYS.anthropicApiKey,
  model: APP_SETTING_KEYS.anthropicModel,
  maxRulesPerTask: APP_SETTING_KEYS.ruleGenMaxRulesPerTask,
  outputLanguage: APP_SETTING_KEYS.claudeOutputLanguage,
} as const;

export const LANGUAGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "auto", label: "Auto — match the source text" },
  { value: "ko", label: "Korean" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "zh", label: "Simplified Chinese (简体中文)" },
];
