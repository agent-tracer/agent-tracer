import { useGuidance } from "~tracer-web/shared/store/index.js";
import { GuidanceText, PageHeader } from "~tracer-web/shared/ui/index.js";
import { DaemonHealthSection } from "~tracer-web/widgets/settings/daemon/DaemonHealthSection.js";
import { GuidanceLanguageSection } from "~tracer-web/widgets/settings/display/GuidanceLanguageSection.js";
import { IdentitySection } from "~tracer-web/widgets/settings/identity/IdentitySection.js";
import { LlmProviderSection } from "~tracer-web/widgets/settings/llm-provider/LlmProviderSection.js";
import { RuleGenerationSettingsSection } from "~tracer-web/widgets/settings/rule-generation/RuleGenerationSettingsSection.js";

/**
 * 서버 설정과 브라우저 전용 표시 설정을 한 화면에서 구분해 제공한다.
 */
export function SettingsPage() {
  const guidance = useGuidance();

  return (
    <div className="flex flex-col min-h-0 h-full overflow-auto">
      <PageHeader
        eyebrow="Settings"
        title="Local monitor configuration"
        intro={guidance.messages.settings.introduction}
        introLocale={guidance.locale}
      />

      <main className="px-9 py-6 flex flex-col gap-6 max-w-3xl">
        <IdentitySection />
        <GuidanceLanguageSection />
        <LlmProviderSection />
        <RuleGenerationSettingsSection />
        <DaemonHealthSection />

        <section className="border border-hair rounded-md py-4 px-5 bg-s1 text-body text-ink-muted">
          <strong className="text-ink">Security note</strong>
          <GuidanceText
            as="p"
            className="mt-1.5"
            locale={guidance.locale}
            message={guidance.messages.settings.securityNote}
          />
        </section>
      </main>
    </div>
  );
}
