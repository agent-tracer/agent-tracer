import type {GuardrailRule} from "~plugin/domain/guardrail/model/rule.model.js";
import type {RuleSourcePort} from "~plugin/domain/guardrail/port/rule.source.port.js";

export class InMemoryRuleSource implements RuleSourcePort {
    readonly nudged: string[] = [];

    constructor(private readonly rules: readonly GuardrailRule[] = []) {}

    async fetchAll(): Promise<readonly GuardrailRule[]> {
        return this.rules;
    }

    async recordNudge(ruleId: string): Promise<void> {
        this.nudged.push(ruleId);
    }
}
