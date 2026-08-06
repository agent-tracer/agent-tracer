import type { ReactNode } from "react";
import type {
  GuidanceLocale,
  GuidanceMessage,
} from "~tracer-web/shared/guidance.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import { CONTROL_SURFACE } from "~tracer-web/shared/ui/controls/Input.js";
import { GuidanceText } from "~tracer-web/shared/ui/index.js";

interface RuleFormFieldPropsBase {
  readonly label: string;
  readonly required?: boolean;
  readonly children: ReactNode;
}

type RuleFormFieldProps = RuleFormFieldPropsBase &
  (
    | {
        readonly hint: GuidanceMessage;
        readonly hintLocale: GuidanceLocale;
      }
    | {
        readonly hint?: never;
        readonly hintLocale?: never;
      }
  );

/** 규칙 폼의 라벨과 선택적 안내 문구를 같은 배치로 표시한다. */
export function RuleFormField({
  label,
  hint,
  hintLocale,
  required,
  children,
}: RuleFormFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-mini uppercase tracking-eyebrow text-ink-tertiary">
        {label}
        {required && <span className="text-err"> *</span>}
      </span>
      {children}
      {hint && (
        <GuidanceText
          className="text-meta text-ink-subtle leading-tight"
          locale={hintLocale}
          message={hint}
        />
      )}
    </label>
  );
}

/** 규칙 폼의 필드 그룹 제목과 안내 문구를 표시한다. */
export function RuleFormSectionHeading({
  label,
  hint,
  hintLocale,
}: {
  readonly label: string;
  readonly hint: GuidanceMessage;
  readonly hintLocale: GuidanceLocale;
}) {
  return (
    <div className="mt-1.5 pt-2 border-t border-hair flex flex-col gap-0.5">
      <span className="text-body font-semibold text-ink tracking-snug">
        {label}
      </span>
      <GuidanceText
        className="text-meta text-ink-subtle leading-tight"
        locale={hintLocale}
        message={hint}
      />
    </div>
  );
}

/** 연관된 규칙 폼 필드 두 개를 같은 행에 배치한다. */
export function RuleFormRow({ children }: { readonly children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

/** 규칙 폼의 컨트롤도 앱의 공통 폼 표면을 그대로 쓰고 너비만 채운다. */
export const ruleFormInputClassName = cn(CONTROL_SURFACE, "w-full font-[inherit]");

export const ruleFormTextareaClassName = cn(
  ruleFormInputClassName,
  "resize-y font-mono leading-normal",
);
