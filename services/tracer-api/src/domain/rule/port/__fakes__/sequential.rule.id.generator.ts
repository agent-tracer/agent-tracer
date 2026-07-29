import type { RuleIdGeneratorPort } from "~tracer-api/domain/rule/port/rule.id.generator.port.js";

export class SequentialRuleIdGenerator implements RuleIdGeneratorPort {
    private position = 0;

    next(): string {
        this.position += 1;
        return `rule-id-${this.position}`;
    }
}
