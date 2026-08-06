import type { ReactNode } from "react";
import type {
  GuidanceLocale,
  GuidanceMessage,
} from "~tracer-web/shared/guidance.js";
import { GuidanceText } from "~tracer-web/shared/GuidanceText.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface FieldPropsBase {
  readonly label: string;
  /** 설정 화면처럼 항목이 줄줄이 이어질 때만 위에 실선을 긋고 자기 여백을 갖는다. */
  readonly separated?: boolean;
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

export function Field({ label, help, helpLocale, separated = false, children }: FieldProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        separated && "py-4 border-t border-hair",
      )}
    >
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
