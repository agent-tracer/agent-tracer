import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge는 `text-body`를 크기가 아니라 색으로 읽어 뒤따르는 `text-ink`와
 * 충돌시키고 지워 버리므로 tokens.css가 정한 눈금 이름을 여기서 알려 준다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["nano", "micro", "mini", "meta", "body", "lead", "title", "display"] },
      ],
      tracking: [{ tracking: ["eyebrow", "label", "snug", "display"] }],
      shadow: [{ shadow: ["elev-1", "elev-2"] }],
    },
  },
});

/** class 문자열을 Tailwind를 인식하는 중복 제거와 함께 병합한다. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
