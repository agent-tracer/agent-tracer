import { useState } from "react";
import { useAppSettingsQuery, useModelOptionsQuery } from "~tracer-web/entities/setting/api/queries.js";
import {
  useDeleteAppSettingMutation,
  usePutAppSettingMutation,
} from "~tracer-web/entities/setting/api/mutations.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import { isNotImplementedError } from "~tracer-web/shared/api/client/response.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, Card, Field, GuidanceText, SectionHeading, Select } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { ModelSettingField, SecretSettingField } from "~tracer-web/widgets/settings/llm-provider/ProviderSettingFields.js";
import {
  LANGUAGE_OPTIONS,
  LLM_PROVIDER_SETTING_KEYS as SETTING_KEYS,
} from "~tracer-web/widgets/settings/llm-provider/llm-provider.catalog.js";

interface ProviderFeedback {
  readonly tone: "ok" | "err";
  readonly message: GuidanceMessage;
  /** 실패한 이유는 봉투의 코드가 고른 말로 뒤에 붙는다. */
  readonly reason?: GuidanceMessage;
}

/** 에이전트 서비스에서 도는 잡이 쓰는 LLM 공급자 설정이다. */
export function LlmProviderSection() {
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
  const [languageDraft, setLanguageDraft] = useState("");
  const [feedback, setFeedback] = useState<ProviderFeedback | null>(null);

  const apiKey = settingsMap.get(SETTING_KEYS.apiKey);
  const model = settingsMap.get(SETTING_KEYS.model);
  const language = settingsMap.get(SETTING_KEYS.outputLanguage);
  const currentLanguage = language?.masked ?? "auto";
  const messages = guidance.messages.settings;

  async function save(key: string, value: string, draftSetter: (v: string) => void) {
    if (!value.trim()) {
      setFeedback({ tone: "err", message: messages.valueRequired });
      return;
    }
    try {
      await putMutation.mutateAsync({ key, value: value.trim() });
      draftSetter("");
      setFeedback({ tone: "ok", message: messages.settingSaved(key) });
    } catch (err) {
      setFeedback({
        tone: "err",
        message: messages.settingSaveFailed(key),
        reason: apiErrorMessage(guidance.messages.common, err),
      });
    }
  }

  async function remove(key: string) {
    try {
      await deleteMutation.mutateAsync(key);
      setFeedback({ tone: "ok", message: messages.settingCleared(key) });
    } catch (err) {
      setFeedback({
        tone: "err",
        message: messages.settingClearFailed(key),
        reason: apiErrorMessage(guidance.messages.common, err),
      });
    }
  }

  // 설정 창구를 세우는 에이전트 서비스가 없는 배포에서는 이 설정이 존재하지 않는다.
  if (isNotImplementedError(error)) return null;

  return (
    <Card surface="canvas" className="py-5 px-6">
      <SectionHeading>LLM provider</SectionHeading>
      <GuidanceText
        as="p"
        className="text-ink-muted text-body mb-5"
        locale={guidance.locale}
        message={guidance.messages.settings.ruleGenerationIntroduction}
      />
      <GuidanceText
        as="p"
        className="text-ink-tertiary text-body mb-4"
        locale={guidance.locale}
        message={guidance.messages.settings.llmProviderScope}
      />

      <SecretSettingField
        label="Anthropic API key"
        help={guidance.messages.settings.anthropicApiKey}
        locale={guidance.locale}
        current={apiKey}
        loading={isLoading}
        pending={putMutation.isPending}
        draft={apiKeyDraft}
        placeholder="sk-ant-…"
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
              className="text-body border-0 px-1 py-1 min-h-6 underline"
            >
              Reset
            </Button>
          )}
        </div>
      </Field>

      {feedback && (
        <p className={cn("mt-4 text-body", feedback.tone === "err" ? "text-err" : "text-ink-muted")}>
          <GuidanceText locale={guidance.locale} message={feedback.message} />
          {feedback.reason !== undefined && (
            <>
              {" "}
              <GuidanceText locale={guidance.locale} message={feedback.reason} />
            </>
          )}
        </p>
      )}
    </Card>
  );
}
