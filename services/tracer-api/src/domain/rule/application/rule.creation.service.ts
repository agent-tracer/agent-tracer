import { Inject, Injectable } from "@nestjs/common";
import {
    RULE_SEVERITY,
    RULE_SOURCE,
    admitReviewState,
    computeRuleSignature,
    type RuleSeverity,
    type RuleSource,
} from "@agent-tracer/kernel";
import { RuleEntity } from "@agent-tracer/tracer-model";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import { RULE_ID_GENERATOR, type RuleIdGeneratorPort } from "~tracer-api/domain/rule/port/rule.id.generator.port.js";
import { RULE_REPOSITORY, type RuleRepositoryPort } from "~tracer-api/domain/rule/port/rule.repository.port.js";
import { mapRule, type RuleDto, type RuleExpectationInput } from "~tracer-api/domain/rule/model/rule.model.js";

export interface RuleCreationInput {
    readonly userId: string;
    readonly name: string;
    readonly expectation: RuleExpectationInput;
    readonly taskId: string;
    /** 규칙을 낳은 사용자 입력이며 판정 창이 여기서 시작한다. */
    readonly anchorEventId: string;
    readonly severity?: RuleSeverity;
    readonly rationale?: string;
    readonly source?: RuleSource;
    /** 원장과 대조해 실재를 확인한 사용자 턴이며 사람이 직접 쓴 규칙에는 없다. */
    readonly citedTurnIds?: readonly string[];
    /** 의무 이행을 보여 주는 이벤트이며 근거가 없으면 비어 있다. */
    readonly citedEventIds?: readonly string[];
    /** 이 규칙을 낳은 생성 요청이며 화면이 규칙에서 실행으로 되짚는 통로다. */
    readonly sourceJobId?: string;
}

/** 사람이 쓴 규칙과 실행기가 낸 제안이 같은 자리에서 규칙이 된다. */
@Injectable()
export class RuleCreationService {
    constructor(
        @Inject(RULE_REPOSITORY)
        private readonly rules: RuleRepositoryPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
        @Inject(RULE_ID_GENERATOR)
        private readonly idGenerator: RuleIdGeneratorPort,
    ) {}

    async create(input: RuleCreationInput): Promise<{ readonly rule: RuleDto; readonly created: boolean }> {
        const now = this.clock.now();
        const signature = computeRuleSignature(input.expectation);

        const siblings = await this.rules.findByAnchor(input.userId, input.anchorEventId);
        const duplicate = siblings.find((rule) => rule.signature === signature);
        if (duplicate !== undefined) return { rule: mapRule(duplicate), created: false };

        const rule = new RuleEntity();
        rule.id = this.idGenerator.next();
        rule.userId = input.userId;
        rule.name = input.name;
        rule.expectation = input.expectation;
        rule.taskId = input.taskId;
        rule.anchorEventId = input.anchorEventId;
        rule.citedTurnIds = [...(input.citedTurnIds ?? [])];
        rule.citedEventIds = [...(input.citedEventIds ?? [])];
        rule.source = input.source ?? RULE_SOURCE.human;
        rule.severity = input.severity ?? RULE_SEVERITY.info;
        rule.reviewState = admitReviewState(rule.source, rule.severity);
        rule.rationale = input.rationale ?? null;
        rule.signature = signature;
        rule.sourceJobId = input.sourceJobId ?? null;
        rule.initializeProvenance(rule.source);
        rule.createdAt = now;
        rule.deletedAt = null;
        await this.rules.upsert(rule);
        return { rule: mapRule(rule), created: true };
    }
}
