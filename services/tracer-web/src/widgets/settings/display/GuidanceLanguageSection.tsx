import {
  useGuidance,
  useGuidanceLocale,
  useSetGuidanceLocale,
} from "~tracer-web/shared/store/index.js";
import { Card, Field, SectionHeading, Select } from "~tracer-web/shared/ui/index.js";

/** 브라우저 안내 문구의 표시 언어를 설정한다. */
export function GuidanceLanguageSection() {
  const guidance = useGuidance();
  const locale = useGuidanceLocale();
  const setLocale = useSetGuidanceLocale();

  return (
    <Card surface="canvas" className="py-5 px-6">
      <SectionHeading>Display</SectionHeading>
      <Field
        separated
        label="Guidance language"
        help={guidance.messages.settings.guidanceLanguage}
        helpLocale={locale}
      >
        <Select
          aria-label="Guidance language"
          value={locale}
          onChange={(event) => setLocale(event.target.value === "ko" ? "ko" : "en")}
        >
          <option value="en">English</option>
          <option value="ko">Korean</option>
        </Select>
      </Field>
    </Card>
  );
}
