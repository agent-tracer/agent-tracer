import { useState } from "react";
import {
  RULE_GENERATION_EFFORTS,
  RULE_GENERATION_LANGUAGES,
  RULE_GENERATION_MAX_RULES_LIMIT,
} from "@agent-tracer/kernel";
import {
  useRuleGenerationSettingsQuery,
  useSaveRuleGenerationSettingsMutation,
} from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, Card, Field, GuidanceText, Input, SectionHeading, Select } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

const LANGUAGE_LABEL: Readonly<Record<string, string>> = {
  auto: "Auto — follow the language of the request",
  ko: "Korean (한국어)",
  en: "English",
  ja: "Japanese (日本語)",
  zh: "Simplified Chinese (简体中文)",
};

const EFFORT_LABEL: Readonly<Record<string, string>> = {
  low: "low — short and narrow",
  medium: "medium",
  high: "high — recommended",
  xhigh: "xhigh — searches more of the workspace",
  max: "max — deepest and most expensive",
};

interface SettingFeedback {
  readonly tone: "ok" | "err";
  readonly message: GuidanceMessage;
  /** 실패한 이유는 봉투의 코드가 고른 말로 뒤에 붙는다. */
  readonly reason?: GuidanceMessage;
}

/** 로컬 실행기가 읽는 설정이며 에이전트 서비스가 없어도 산다. */
export function RuleGenerationSettingsSection() {
  const guidance = useGuidance();
  const settingsQuery = useRuleGenerationSettingsQuery();
  const save = useSaveRuleGenerationSettingsMutation();
  const [maxRulesDraft, setMaxRulesDraft] = useState("");
  const [modelDraft, setModelDraft] = useState("");
  const [feedback, setFeedback] = useState<SettingFeedback | null>(null);
  const settings = settingsQuery.data;

  /** 실패한 저장이 적던 값을 지우지 않도록 저장이 실제로 됐는지 알려 준다. */
  async function apply(
    patch: Parameters<typeof save.mutateAsync>[0],
    label: string,
  ): Promise<boolean> {
    const messages = guidance.messages.settings;
    try {
      await save.mutateAsync(patch);
      setFeedback({ tone: "ok", message: messages.settingSaved(label) });
      return true;
    } catch (error) {
      setFeedback({
        tone: "err",
        message: messages.settingSaveFailed(label),
        reason: apiErrorMessage(guidance.messages.common, error),
      });
      return false;
    }
  }

  return (
    <Card surface="canvas" className="py-5 px-6">
      <SectionHeading>Rule generation</SectionHeading>
      <GuidanceText
        as="p"
        className="text-ink-muted text-body mb-5"
        locale={guidance.locale}
        message={guidance.messages.settings.ruleGenerationSection}
      />

      <Field label="Model">
        <div className="flex items-center gap-2">
          <Input
            placeholder={settings?.model ?? "claude-sonnet-5"}
            value={modelDraft}
            onChange={(e) => setModelDraft(e.target.value)}
            className="w-[220px]"
          />
          <Button
            variant="ghost"
            disabled={modelDraft.trim().length === 0 || save.isPending}
            onClick={() =>
              void apply({ model: modelDraft.trim() }, "Model").then((saved) => {
                if (saved) setModelDraft("");
              })
            }
          >
            Save
          </Button>
          <Button
            variant="ghost"
            className="text-body border-0 p-0 underline"
            onClick={() => void apply({ model: null }, "Model")}
          >
            Reset
          </Button>
        </div>
      </Field>

      <Field label="Effort">
        <Select
          value={settings?.effort ?? "high"}
          disabled={save.isPending}
          onChange={(e) => void apply({ effort: e.target.value }, "Effort")}
        >
          {RULE_GENERATION_EFFORTS.map((value) => (
            <option key={value} value={value}>
              {EFFORT_LABEL[value] ?? value}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Rule language">
        <Select
          value={settings?.outputLanguage ?? "auto"}
          disabled={save.isPending}
          onChange={(e) => void apply({ outputLanguage: e.target.value }, "Rule language")}
        >
          {RULE_GENERATION_LANGUAGES.map((value) => (
            <option key={value} value={value}>
              {LANGUAGE_LABEL[value] ?? value}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Max rules per request">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={RULE_GENERATION_MAX_RULES_LIMIT}
            placeholder={String(settings?.maxRulesPerTask ?? 5)}
            value={maxRulesDraft}
            onChange={(e) => setMaxRulesDraft(e.target.value)}
            className="w-20"
          />
          <Button
            variant="ghost"
            disabled={maxRulesDraft.trim().length === 0 || save.isPending}
            onClick={() =>
              void apply({ maxRulesPerTask: Number(maxRulesDraft) }, "Max rules per request").then(
                (saved) => {
                  if (saved) setMaxRulesDraft("");
                },
              )
            }
          >
            Save
          </Button>
        </div>
      </Field>

      {feedback !== null && (
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
