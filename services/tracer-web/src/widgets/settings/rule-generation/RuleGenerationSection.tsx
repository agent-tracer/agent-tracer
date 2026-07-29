import { useState } from "react";
import { useAppSettingsQuery, useModelOptionsQuery } from "~tracer-web/entities/setting/api/queries.js";
import {
  useDeleteAppSettingMutation,
  usePutAppSettingMutation,
} from "~tracer-web/entities/setting/api/mutations.js";
import { isNotImplementedError } from "~tracer-web/shared/api/client/response.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import {
  Button,
  Card,
  Field,
  GuidanceText,
  Input,
  Select,
} from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { ModelSettingField, SecretSettingField } from "~tracer-web/widgets/settings/rule-generation/ProviderSettingFields.js";
import {
  LANGUAGE_OPTIONS,
  RULE_GENERATION_SETTING_KEYS as SETTING_KEYS,
} from "~tracer-web/widgets/settings/rule-generation/rule-generation.catalog.js";

/** 규칙 자동생성 설정: Anthropic API 키 + 모델 + 태스크당 최대 규칙 수 + 출력 언어. */
/** 규칙 생성 공급자와 출력 정책을 설정한다. */
export function RuleGenerationSection() {
  const guidance = useGuidance();
  const { data, isLoading, error } = useAppSettingsQuery();
  const modelOptions = useModelOptionsQuery();
  const putMutation = usePutAppSettingMutation();
  const deleteMutation = useDeleteAppSettingMutation();

  const settingsMap = new Map<string, { masked: string; updatedAt: string }>();
  for (const item of data?.settings ?? []) {
    settingsMap.set(item.key, { masked: item.maskedValue, updatedAt: item.updatedAt });
  }

  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [modelDraft, setModelDraft] = useState("");
  const [maxRulesDraft, setMaxRulesDraft] = useState("");
  const [languageDraft, setLanguageDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const apiKey = settingsMap.get(SETTING_KEYS.apiKey);
  const model = settingsMap.get(SETTING_KEYS.model);
  const maxRules = settingsMap.get(SETTING_KEYS.maxRulesPerTask);
  const language = settingsMap.get(SETTING_KEYS.outputLanguage);
  const currentLanguage = language?.masked ?? "auto";
  async function save(key: string, value: string, draftSetter: (v: string) => void) {
    if (!value.trim()) {
      setFeedback("Value cannot be empty.");
      return;
    }
    try {
      await putMutation.mutateAsync({ key, value: value.trim() });
      draftSetter("");
      setFeedback(`Saved ${key}.`);
    } catch (err) {
      setFeedback(`Failed to save ${key}: ${(err as Error).message}`);
    }
  }

  async function remove(key: string) {
    try {
      await deleteMutation.mutateAsync(key);
      setFeedback(`Cleared ${key}.`);
    } catch (err) {
      setFeedback(`Failed to clear ${key}: ${(err as Error).message}`);
    }
  }

  // 설정 창구를 세우는 에이전트 서비스가 없는 배포에서는 이 설정이 존재하지 않는다.
  if (isNotImplementedError(error)) return null;

  return (
    <Card surface="canvas" className="py-5 px-6">
      <h2 className="text-[15px] font-semibold mb-1">Rule generation</h2>
      <GuidanceText
        as="p"
        className="text-ink-muted text-[12.5px] mb-5"
        locale={guidance.locale}
        message={guidance.messages.settings.ruleGenerationIntroduction}
      />

      <SecretSettingField
        label="Anthropic API key"
        help={guidance.messages.settings.anthropicApiKey}
        locale={guidance.locale}
        current={apiKey}
        loading={isLoading}
        pending={putMutation.isPending}
        draft={apiKeyDraft}
        placeholder="sk-ant-..."
        onDraftChange={setApiKeyDraft}
        onSave={() => void save(SETTING_KEYS.apiKey, apiKeyDraft, setApiKeyDraft)}
        onClear={() => void remove(SETTING_KEYS.apiKey)}
      />

      <ModelSettingField
        label="Anthropic model"
        help={guidance.messages.settings.anthropicModel}
        locale={guidance.locale}
        current={model}
        pending={putMutation.isPending}
        draft={modelDraft}
        options={(modelOptions.data ?? []).map((option) => ({ value: option.id, label: option.label }))}
        onDraftChange={setModelDraft}
        onSave={() => void save(SETTING_KEYS.model, modelDraft, setModelDraft)}
        onClear={() => void remove(SETTING_KEYS.model)}
      />

      <Field
        label="Max rules per task"
        help={guidance.messages.settings.maxRules}
        helpLocale={guidance.locale}
      >
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={20}
            placeholder={maxRules?.masked ?? "5"}
            value={maxRulesDraft}
            onChange={(e) => setMaxRulesDraft(e.target.value)}
            className="w-20"
          />
          <Button
            variant="ghost"
            disabled={!maxRulesDraft.trim() || putMutation.isPending}
            onClick={() => void save(SETTING_KEYS.maxRulesPerTask, maxRulesDraft, setMaxRulesDraft)}
          >
            Save
          </Button>
          {maxRules && (
            <Button
              variant="ghost"
              onClick={() => void remove(SETTING_KEYS.maxRulesPerTask)}
              className="text-xs border-0 p-0 underline"
            >
              Clear
            </Button>
          )}
        </div>
      </Field>

      <Field
        label="Output language"
        help={guidance.messages.settings.outputLanguage}
        helpLocale={guidance.locale}
      >
        <div className="flex items-center gap-2">
          <Select
            value={languageDraft || currentLanguage}
            onChange={(e) => setLanguageDraft(e.target.value)}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            disabled={
              !languageDraft.trim() ||
              languageDraft === currentLanguage ||
              putMutation.isPending
            }
            onClick={() => void save(SETTING_KEYS.outputLanguage, languageDraft, setLanguageDraft)}
          >
            Save
          </Button>
          {language && (
            <Button
              variant="ghost"
              onClick={() => void remove(SETTING_KEYS.outputLanguage)}
              className="text-xs border-0 p-0 underline"
            >
              Reset to auto
            </Button>
          )}
        </div>
      </Field>

      {feedback && (
        <p className={cn("mt-4 text-xs", feedback.startsWith("Failed") ? "text-err" : "text-ink-muted")}>
          {feedback}
        </p>
      )}
    </Card>
  );
}
