import {describe, expect, it} from "vitest";
import {
    buildRuleProposalPolicy,
    resolveRuleLanguageDirective,
    GUIDELINE_CLAUSE,
} from "~plugin/domain/rulegen/model/proposal.policy.model.js";

function policy(maxRules = 2, language = "auto"): string {
    return buildRuleProposalPolicy({maxRules, language, anchorDirective: "", intentDirective: ""});
}

describe("buildRuleProposalPolicy", () => {
    it("규칙 수에 하한을 두지 않아 없는 의무를 지어내지 않게 한다", () => {
        expect(policy(5)).toContain("Output AT MOST 5 rules");
        expect(policy(5)).not.toMatch(/exactly \d+-\d+ rules/);
    });

    it("0개가 옳고 흔하다고 적는다", () => {
        expect(policy()).toContain(GUIDELINE_CLAUSE.zeroIsCorrect);
    });

    it("의무와 습관을 가르는 예시 둘을 싣는다", () => {
        const built = policy();

        expect(built).toContain("GOOD --");
        expect(built).toContain("NOT A RULE --");
    });

    it("이미 있는 규칙과 겹치는 제안을 막는다", () => {
        expect(policy()).toContain(GUIDELINE_CLAUSE.noOverlapWithExisting);
    });
});

describe("resolveRuleLanguageDirective", () => {
    it("아는 언어는 그 언어로 쓰라고 한다", () => {
        expect(resolveRuleLanguageDirective("ko")).toContain("Korean");
        expect(resolveRuleLanguageDirective("ja")).toContain("Japanese");
    });

    it("모르는 값은 요구가 쓰인 언어를 따르게 한다", () => {
        expect(resolveRuleLanguageDirective("kl")).toBe(resolveRuleLanguageDirective("auto"));
    });
});
