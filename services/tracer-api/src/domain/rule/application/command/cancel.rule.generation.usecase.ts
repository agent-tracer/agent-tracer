import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import {
    RULE_GENERATION_REPOSITORY,
    type RuleGenerationRepositoryPort,
} from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";
import { mapRuleGeneration, type RuleGenerationDto } from "~tracer-api/domain/rule/model/rule.generation.model.js";

/** 사람이 멈춘 요청을 실행기가 하트비트에서 읽고 손을 뗀다. */
@Injectable()
export class CancelRuleGenerationUseCase {
    constructor(
        @Inject(RULE_GENERATION_REPOSITORY)
        private readonly requests: RuleGenerationRepositoryPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
    ) {}

    async execute(userId: string, id: string): Promise<{ readonly request: RuleGenerationDto; readonly canceled: boolean }> {
        const canceled = await this.requests.cancel(userId, id, this.clock.now());
        const request = await this.requests.findById(id);
        if (request === null || request.userId !== userId) {
            throw new NotFoundException("Rule generation request not found");
        }
        return { request: mapRuleGeneration(request), canceled };
    }
}
