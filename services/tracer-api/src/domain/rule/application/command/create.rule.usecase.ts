import { Injectable } from "@nestjs/common";
import { RuleCreationService, type RuleCreationInput } from "~tracer-api/domain/rule/application/rule.creation.service.js";
import type { RuleDto } from "~tracer-api/domain/rule/model/rule.model.js";

export type CreateRuleInput = RuleCreationInput;

/** 사람이 화면에서 쓴 규칙을 받는다. */
@Injectable()
export class CreateRuleUseCase {
    constructor(private readonly creation: RuleCreationService) {}

    async execute(input: CreateRuleInput): Promise<{ readonly rule: RuleDto; readonly created: boolean }> {
        return this.creation.create(input);
    }
}
