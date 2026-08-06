import type { ReactNode } from "react";
import type { GuidanceLocale, GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { GuidanceText } from "~tracer-web/shared/GuidanceText.js";

interface PageHeaderPropsBase {
  /** 이 화면이 속한 곳을 "Workspace"처럼 한 낱말로 적는다. */
  readonly eyebrow: string;
  readonly title: string;
  /** 목록 수나 조회 상태처럼 제목 아래 한 줄로 붙는 사실. */
  readonly status?: ReactNode;
  /** 오른쪽 끝에 서는 주 행동 버튼. */
  readonly actions?: ReactNode;
}

type PageHeaderProps = PageHeaderPropsBase &
  (
    | {
        readonly intro: GuidanceMessage;
        readonly introLocale: GuidanceLocale;
      }
    | {
        readonly intro?: never;
        readonly introLocale?: never;
      }
  );

/** 워크스페이스 화면 넷이 각자 짜던 머리를 한 자리로 모은 것이다. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  introLocale,
  status,
  actions,
}: PageHeaderProps) {
  return (
    <header className="px-9 pt-6 pb-4 flex flex-col gap-3 border-b border-hair">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 font-mono text-mini uppercase tracking-eyebrow text-ink-tertiary">
            {eyebrow}
          </p>
          <h1 className="mt-0.5 mb-0 text-display font-semibold text-ink tracking-display">
            {title}
          </h1>
          {intro && (
            <GuidanceText
              as="p"
              className="mt-1 mb-0 text-body text-ink-subtle"
              locale={introLocale}
              message={intro}
            />
          )}
          {status !== undefined && (
            <p className="mt-1 mb-0 text-body text-ink-subtle">{status}</p>
          )}
        </div>
        {actions && <span className="flex items-center gap-2 shrink-0">{actions}</span>}
      </div>
    </header>
  );
}
