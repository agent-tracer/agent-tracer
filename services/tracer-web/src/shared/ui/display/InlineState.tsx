import type { ReactNode } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

/** 목록이 답을 못 내놓은 자리에 서는 한 줄이고 전체 화면은 [EmptyView]가 맡는다. */

/** `subject`는 "recipes"처럼 소문자 명사구를 받고 말줄임표는 여기서 붙인다. */
export function loadingLabel(subject: string): string {
  return `Loading ${subject}…`;
}

/** [EmptyView]처럼 눈금이 큰 자리가 쓰는 제목이라 마침표가 없다. */
export function loadFailedTitle(subject: string): string {
  return `Couldn't load ${subject}`;
}

/** 같은 사정을 본문 한 줄로 말하는 문장이라 마침표가 붙는다. */
export function loadFailedLabel(subject: string): string {
  return `${loadFailedTitle(subject)}.`;
}

interface InlineStateBaseProps {
  /** 사이드바처럼 좁은 자리에서 위아래 여백을 줄인다. */
  readonly dense?: boolean;
  readonly className?: string;
}

type InlineStateProps = InlineStateBaseProps &
  (
    | {
        readonly state: "loading" | "error";
        /** 무엇을 불러오는지 소문자 명사구로 넘긴다. */
        readonly subject: string;
        readonly children?: never;
      }
    | {
        /** 정해진 문구로 말할 수 없는 사정은 본문을 직접 넘긴다. */
        readonly state: "error" | "empty";
        readonly subject?: never;
        readonly children: ReactNode;
      }
  );

export function InlineState({
  state,
  subject,
  children,
  dense = false,
  className,
}: InlineStateProps) {
  const text =
    subject === undefined
      ? children
      : state === "loading"
        ? loadingLabel(subject)
        : loadFailedLabel(subject);

  return (
    <p
      className={cn(
        "m-0 text-center text-body",
        dense ? "px-3 py-4" : "py-8",
        state === "error" ? "text-err" : "text-ink-subtle",
        className,
      )}
    >
      {text}
    </p>
  );
}
