// 디자인 축마다 눈금이 하나뿐이라는 규칙을 클래스 문자열에서 지킨다.

const VIOLATIONS = [
  {
    pattern: /\btext-\[[\d.]+(?:px|rem|em)\]/,
    message:
      "글자 크기는 눈금 이름으로 쓴다. text-nano/micro/mini/meta/body/lead/title/display 중에 고르고 없으면 tokens.css의 눈금을 먼저 넓힌다",
  },
  {
    pattern: /\btext-(?:xs|sm|base|lg|xl|\dxl)\b/,
    message:
      "Tailwind 기본 글자 눈금 대신 이 앱의 눈금을 쓴다. text-body가 기본이고 text-lead가 강조 줄이다",
  },
  {
    pattern: /\btracking-\[(?!inherit\])/,
    message:
      "자간은 tracking-eyebrow/label/snug/display 중에 고른다",
  },
  {
    pattern: /\bleading-\[[\d.]+\]/,
    message:
      "줄간은 leading-tight 또는 leading-normal을 쓰고 상자 높이를 맞출 때만 px를 쓴다",
  },
  {
    pattern: /\[var\(--/,
    message:
      "토큰은 임의값이 아니라 유틸리티로 읽는다. bg-s1, text-ink-subtle, shadow-elev-1처럼 쓴다",
  },
  {
    pattern: /\bshadow-\[/,
    message: "그림자는 shadow-elev-1 또는 shadow-elev-2를 쓴다",
  },
  {
    // 화면 가장자리 여백은 뜻이 있는 하나의 값이라 이름을 갖는다.
    pattern: /(?<![\w-])-?[pm]x-9(?![\w.-])/,
    message: "화면 가장자리 여백은 px-gutter로 쓰고 값은 tokens.css가 정한다",
  },
  {
    pattern: /\brounded-\[/,
    message: "모서리는 rounded-xs/sm/md/lg/pill 중에 고른다",
  },
  {
    pattern: /\b(?:text|bg|border)-(?:white|black|(?:red|green|blue|gray|slate|zinc|neutral|stone|amber|yellow|orange|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/,
    message:
      "Tailwind 기본 팔레트를 쓰지 않는다. 이 앱의 색은 canvas/s1~s4, ink 계열, primary, ok/warn/err, ph-* 뿐이다",
  },
  {
    // 다른 디자인 시스템에서 쓰던 이름은 여기서 아무 색도 만들지 않고 조용히 사라진다.
    pattern:
      /\b(?:text|bg|border|ring|fill|stroke)-(?:danger|destructive|success|info|muted|accent|secondary|foreground|background|surface)\b/,
    message:
      "이 앱에 없는 색 이름이다. 위험은 err, 성공은 ok, 흐린 글자는 ink-subtle 또는 ink-tertiary다",
  },
  {
    pattern: /\bfocus-visible:(?:ring|outline)-/,
    message:
      "포커스 표시는 focus-ring 또는 focus-ring-within 유틸리티 하나로 통일한다",
  },
  {
    pattern: /\bdisabled:(?:opacity|cursor)-/,
    message:
      "비활성 표시는 shared/ui가 내보내는 DISABLED 상수를 쓴다",
  },
];

/** 색과 눈금과 상태 표시가 화면마다 갈라지지 않게 클래스 문자열을 검사한다. */
export const designTokens = {
  meta: { type: "problem", schema: [] },
  create(context) {
    const seen = new Set();

    function check(node, text) {
      if (typeof text !== "string" || text.length === 0) return;
      for (const { pattern, message } of VIOLATIONS) {
        const match = pattern.exec(text);
        if (!match) continue;
        const key = `${node.range[0]}:${message}`;
        if (seen.has(key)) continue;
        seen.add(key);
        context.report({ node, message: `${message} (\`${match[0]}\`)` });
      }
    }

    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked);
      },
      JSXText(node) {
        check(node, node.value);
      },
    };
  },
};
