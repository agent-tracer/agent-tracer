import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
    RULE_GENERATION_STATUS,
    RULE_SOURCE,
    type RuleGenerationObservation,
} from "@agent-tracer/kernel";
import type { RuleProposalPayload } from "@agent-tracer/kernel/rule/proposal/rule.proposal.schema.js";
import type { RuleGenerationStep } from "@agent-tracer/tracer-model";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import {
    RULE_GENERATION_REPOSITORY,
    type RuleGenerationRepositoryPort,
} from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";
import { RuleCreationService } from "~tracer-api/domain/rule/application/rule.creation.service.js";

interface SettleRuleGenerationInput {
    readonly userId: string;
    readonly id: string;
    readonly owner: string;
    readonly observation: RuleGenerationObservation;
    readonly steps: readonly RuleGenerationStep[];
}

export interface CompleteRuleGenerationInput extends SettleRuleGenerationInput {
    readonly proposals: readonly RuleProposalPayload[];
    readonly skipped: readonly string[];
}

export interface FailRuleGenerationInput extends SettleRuleGenerationInput {
    readonly message: string;
}

export type SettleOutcome = "settled" | "lease-lost";

/** 실행기가 실은 산출물을 규칙으로 만들고 요청을 종결한다. */
@Injectable()
export class SettleRuleGenerationUseCase {
    constructor(
        @Inject(RULE_GENERATION_REPOSITORY)
        private readonly requests: RuleGenerationRepositoryPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
        private readonly creation: RuleCreationService,
    ) {}

    async complete(
        input: CompleteRuleGenerationInput,
    ): Promise<{ readonly outcome: SettleOutcome; readonly createdRuleIds: readonly string[] }> {
        const request = await this.owned(input.userId, input.id);
        // 리스를 잃은 실행기의 산출물로 규칙을 만들면 회수된 요청이 두 번 청구된다.
        if (request.leaseOwner !== input.owner || request.status !== RULE_GENERATION_STATUS.running) {
            return { outcome: "lease-lost", createdRuleIds: [] };
        }

        const createdRuleIds: string[] = [];
        for (const proposal of input.proposals.slice(0, request.maxRules ?? input.proposals.length)) {
            const { rule, created } = await this.creation.create({
                userId: input.userId,
                name: proposal.name,
                expectation: proposal.expect,
                taskId: request.taskId,
                anchorEventId: request.anchorEventId,
                source: RULE_SOURCE.agent,
                citedTurnIds: proposal.citedTurnIds,
                citedEventIds: proposal.citedEventIds,
                sourceJobId: request.id,
                ...(proposal.severity !== undefined ? { severity: proposal.severity } : {}),
                ...(proposal.rationale !== undefined ? { rationale: proposal.rationale } : {}),
            });
            if (created) createdRuleIds.push(rule.id);
        }

        const settled = await this.requests.settleWithLease(
            input.id,
            input.owner,
            {
                status: RULE_GENERATION_STATUS.completed,
                observation: input.observation,
                steps: [...input.steps],
                skipped: input.skipped,
                createdRuleIds,
                error: null,
            },
            this.clock.now(),
        );
        return settled ? { outcome: "settled", createdRuleIds } : { outcome: "lease-lost", createdRuleIds };
    }

    async fail(input: FailRuleGenerationInput): Promise<SettleOutcome> {
        await this.owned(input.userId, input.id);
        const settled = await this.requests.settleWithLease(
            input.id,
            input.owner,
            {
                status: RULE_GENERATION_STATUS.failed,
                observation: input.observation,
                steps: [...input.steps],
                skipped: [],
                createdRuleIds: [],
                error: input.message,
            },
            this.clock.now(),
        );
        return settled ? "settled" : "lease-lost";
    }

    private async owned(userId: string, id: string) {
        const request = await this.requests.findById(id);
        if (request === null || request.userId !== userId) {
            throw new NotFoundException("Rule generation request not found");
        }
        return request;
    }
}
