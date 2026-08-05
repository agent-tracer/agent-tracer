import {RULE_EXPECTED_ACTIONS, RULE_SEVERITIES} from "@agent-tracer/kernel/rule/definition/rule.vocabulary.js";
import {buildSeverityGuidance} from "~plugin/domain/rulegen/model/severity.clause.model.js";
import {RULEGEN_TOOL} from "~plugin/domain/rulegen/model/rulegen.tool.model.js";

export const RULE_EXPECTATION_FIELD_GUIDE = `  - expect   : { kind, ... } -- kind selects exactly one shape:
               kind="command"  : commandMatches (required, literal commands the agent must run)
               kind="pattern"  : pattern (required regex), tool (optional, narrows which call kind to check)
               kind="action"   : tool (required, one of exactly: ${RULE_EXPECTED_ACTIONS.join(", ")})
               Every rule states what the agent MUST do. A rule cannot state a prohibition.
               Prefer kind="command" (literal commands) over kind="pattern" (regex).`;

const FIELD_GUIDE = `Each rule has:
  - name     : short imperative (under 60 chars)
${RULE_EXPECTATION_FIELD_GUIDE}
  - severity : one of exactly: ${RULE_SEVERITIES.join(", ")} (optional, defaults to "info" if omitted)
  - rationale: 1 short sentence (under 200 chars)`;

/** 규칙 하나가 무엇이고 무엇이 아닌지를 말로 설명하기보다 보여 준다. */
const EXAMPLES = `Two examples, to fix the line between an obligation and a habit:

  GOOD -- the user said "린트 돌리고 커밋해줘", so running the lint command is an obligation:
    { "name": "린트를 실행한다",
      "expect": { "kind": "command", "commandMatches": ["npm run lint"] },
      "severity": "warn",
      "rationale": "사용자가 린트를 돌리라고 명시적으로 요청했다" }

  NOT A RULE -- the agent happened to read six files before editing. The user never asked for
  that, so it is the agent's habit, not an obligation. Proposing it polices style and is wrong:
    { "name": "편집 전에 파일을 읽는다", "expect": { "kind": "action", "tool": "file-read" } }`;

/** 모델이 제안을 고를 때 지키는 절이다. */
export const GUIDELINE_CLAUSE = {
    obligationsFromRequest: "  - Every rule states one obligation the request implies. Split distinct obligations into distinct rules.",
    groundInWorkspace: "  - Ground each obligation in what the repository actually contains: the real test command, the real path. Never invent an obligation the user never asked for.",
    noOverlapWithExisting: `  - DO NOT propose any rule whose intent or expected action overlaps an existing rule from ${RULEGEN_TOOL.rules}().`,
    zeroIsCorrect: "  - Returning zero rules is correct and common. A request carrying no verifiable obligation gets an empty array.",
} as const;

const LANGUAGE_DIRECTIVES: Readonly<Record<string, string>> = {
    auto: "Mirror the language of the request (Korean → Korean, English → English, etc.).",
    ko: "Write every rule name and rationale in Korean (한국어).",
    en: "Write every rule name and rationale in English.",
    ja: "Write every rule name and rationale in Japanese (日本語).",
    zh: "Write every rule name and rationale in Simplified Chinese (简体中文).",
};

export function resolveRuleLanguageDirective(language: string): string {
    return LANGUAGE_DIRECTIVES[language] ?? LANGUAGE_DIRECTIVES["auto"]!;
}

/** 상한만 두고 하한을 두지 않아야 없는 의무를 지어내지 않는다. */
function countClause(maxRules: number): string {
    return `  - Output AT MOST ${maxRules} rules, one per distinct obligation. Fewer is better than padded.`;
}

export interface RuleProposalPolicyOptions {
    readonly maxRules: number;
    readonly language: string;
    readonly anchorDirective: string;
    readonly intentDirective: string;
}

/** 규칙 제안의 필드와 심각도와 지침과 언어 정책이다. */
export function buildRuleProposalPolicy(options: RuleProposalPolicyOptions): string {
    return [
        FIELD_GUIDE,
        "",
        buildSeverityGuidance(),
        "",
        "Guidelines:",
        GUIDELINE_CLAUSE.obligationsFromRequest,
        GUIDELINE_CLAUSE.groundInWorkspace,
        GUIDELINE_CLAUSE.noOverlapWithExisting,
        countClause(options.maxRules),
        GUIDELINE_CLAUSE.zeroIsCorrect,
        `${options.anchorDirective}${options.intentDirective}`,
        EXAMPLES,
        "",
        `Output language: ${resolveRuleLanguageDirective(options.language)}`,
    ].join("\n");
}
