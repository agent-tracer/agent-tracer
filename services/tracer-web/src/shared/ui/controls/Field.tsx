import type { ReactNode } from "react";
import type {
  GuidanceLocale,
  GuidanceMessage,
} from "~tracer-web/shared/guidance.js";
import { GuidanceText } from "~tracer-web/shared/GuidanceText.js";

interface FieldPropsBase {
  readonly label: string;
  readonly children: ReactNode;
}

type FieldProps = FieldPropsBase &
  (
    | {
        readonly help: GuidanceMessage;
        readonly helpLocale: GuidanceLocale;
      }
    | {
        readonly help?: never;
        readonly helpLocale?: never;
      }
  );

export function Field({ label, help, helpLocale, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5 py-4 border-t border-hair">
      <div>
        <label className="text-body font-medium text-ink tracking-snug">
          {label}
        </label>
        {help && (
          <GuidanceText
            as="p"
            className="text-meta text-ink-tertiary mt-0.5"
            locale={helpLocale}
            message={help}
          />
        )}
      </div>
      {children}
    </div>
  );
}
