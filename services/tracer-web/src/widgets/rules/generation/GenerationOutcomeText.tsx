import type { GuidanceLocale, GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { isGuidanceMessage } from "~tracer-web/shared/guidance.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";

interface GenerationOutcomeTextProps {
  readonly locale: GuidanceLocale;
  readonly value: GuidanceMessage | string;
  readonly className?: string;
}

/** 잰 관측과 서버가 준 사유는 문자열로, 화면이 짓는 말은 목록에서 온다. */
export function GenerationOutcomeText({ locale, value, className }: GenerationOutcomeTextProps) {
  if (isGuidanceMessage(value)) {
    return (
      <GuidanceText
        locale={locale}
        message={value}
        {...(className !== undefined ? { className } : {})}
      />
    );
  }
  return <span className={className}>{value}</span>;
}
