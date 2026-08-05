import { Inject, Injectable } from "@nestjs/common";
import {
    RULE_GENERATION_MAX_RULES_LIMIT,
    RULE_GENERATION_STATUS,
    EMPTY_RULE_GENERATION_OBSERVATION,
    normalizeRuleGenerationIntent,
} from "@agent-tracer/kernel";
import { RuleGenerationEntity } from "@agent-tracer/tracer-model";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import { RULE_ID_GENERATOR, type RuleIdGeneratorPort } from "~tracer-api/domain/rule/port/rule.id.generator.port.js";
import {
    RULE_GENERATION_REPOSITORY,
    type RuleGenerationRepositoryPort,
} from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";
import { mapRuleGeneration, type RuleGenerationDto } from "~tracer-api/domain/rule/model/rule.generation.model.js";

export interface RequestRuleGenerationInput {
    readonly userId: string;
    readonly taskId: string;
    readonly anchorEventId: string;
    readonly intent?: string;
    readonly maxRules?: number;
}

function boundedMaxRules(value: number | undefined): number | null {
    if (value === undefined || !Number.isInteger(value) || value < 1) return null;
    return Math.min(value, RULE_GENERATION_MAX_RULES_LIMIT);
}

/** 앵커 하나에 요청 하나를 두며 이미 도는 요청이 있으면 그것을 그대로 돌려준다. */
@Injectable()
export class RequestRuleGenerationUseCase {
    constructor(
        @Inject(RULE_GENERATION_REPOSITORY)
        private readonly requests: RuleGenerationRepositoryPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
        @Inject(RULE_ID_GENERATOR)
        private readonly idGenerator: RuleIdGeneratorPort,
    ) {}

    async execute(
        input: RequestRuleGenerationInput,
    ): Promise<{ readonly request: RuleGenerationDto; readonly created: boolean }> {
        const active = await this.requests.findActiveByAnchor(input.userId, input.anchorEventId);
        if (active !== null) return { request: mapRuleGeneration(active), created: false };

        const request = new RuleGenerationEntity();
        request.id = this.idGenerator.next();
        request.userId = input.userId;
        request.taskId = input.taskId;
        request.anchorEventId = input.anchorEventId;
        request.intent = normalizeRuleGenerationIntent(input.intent) ?? null;
        request.maxRules = boundedMaxRules(input.maxRules);
        request.status = RULE_GENERATION_STATUS.pending;
        request.leaseOwner = null;
        request.leaseExpiresAt = null;
        request.observation = EMPTY_RULE_GENERATION_OBSERVATION;
        request.steps = [];
        request.skipped = [];
        request.createdRuleIds = [];
        request.error = null;
        request.createdAt = this.clock.now();
        request.startedAt = null;
        request.finishedAt = null;

        await this.requests.insert(request);
        return { request: mapRuleGeneration(request), created: true };
    }
}
