export const RULE_ID_GENERATOR = Symbol("RULE_ID_GENERATOR");

export interface RuleIdGeneratorPort {
    next(): string;
}
