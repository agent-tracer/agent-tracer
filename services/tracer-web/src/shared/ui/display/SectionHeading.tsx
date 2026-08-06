import type { ReactNode } from "react";

interface SectionHeadingProps {
  readonly children: ReactNode;
  /** 제목 줄 오른쪽 끝에 서는 링크나 버튼. */
  readonly action?: ReactNode;
}

/** 설정처럼 넓은 화면의 구획 제목이며 좁은 패널의 눈썹 라벨은 [SectionLabel]이다. */
export function SectionHeading({ children, action }: SectionHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-1">
      <h2 className="m-0 text-title font-semibold text-ink tracking-snug">{children}</h2>
      {action}
    </div>
  );
}
