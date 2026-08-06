import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Chip, type ChipTone } from "~tracer-web/shared/ui/display/Chip.js";
import { InlineState } from "~tracer-web/shared/ui/display/InlineState.js";

/**
 * `./ui`는 연합 리모트가 실행 시점에 받아 쓰는 표면이라 배포된 리모트를 다시 만들기
 * 전에는 이름을 뺄 수 없으므로, 여기 있는 것들이 새 컴포넌트로 이어 준다.
 */

type BadgeVariant = "neutral" | "viol" | "appr" | "upd" | "runtime";

const BADGE_TONE: Readonly<Record<BadgeVariant, ChipTone>> = {
  neutral: "neutral",
  viol: "err",
  appr: "warn",
  upd: "primary",
  runtime: "quiet",
};

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  readonly variant?: BadgeVariant;
}

/** 호스트는 [Chip]을 쓰며 이 이름은 리모트가 부르는 옛 이름이다. */
export function Badge({ variant = "neutral", ...props }: BadgeProps) {
  return <Chip tone={BADGE_TONE[variant]} {...props} />;
}

/** 호스트는 [InlineState]를 쓰며 이 이름은 리모트가 부르는 옛 이름이다. */
export function EmptyHint({ children }: { readonly children: ReactNode }) {
  return <InlineState state="empty">{children}</InlineState>;
}
