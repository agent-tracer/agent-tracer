import { describe, expect, it } from "vitest";
import {
    EMPTY_RULE_GENERATION_OBSERVATION,
    RULE_EXPECTATION_KIND,
    RULE_GENERATION_STATUS,
} from "@agent-tracer/kernel";
import type { RuleProposalPayload } from "@agent-tracer/kernel/rule/proposal/rule.proposal.schema.js";
import { FixedClock } from "~tracer-api/domain/rule/port/__fakes__/fixed.clock.js";
import { InMemoryRuleGenerationRepository } from "~tracer-api/domain/rule/port/__fakes__/in-memory.rule.generation.repository.js";
import { InMemoryRuleRepository } from "~tracer-api/domain/rule/port/__fakes__/in-memory.rule.repository.js";
import { SequentialRuleIdGenerator } from "~tracer-api/domain/rule/port/__fakes__/sequential.rule.id.generator.js";
import { RuleCreationService } from "~tracer-api/domain/rule/application/rule.creation.service.js";
import { GENERATION_NOW, generationRow } from "./rule.generation.fixture.js";
import { SettleRuleGenerationUseCase } from "./settle.rule.generation.usecase.js";

const OBSERVATION = { ...EMPTY_RULE_GENERATION_OBSERVATION, model: "claude-sonnet-5", costUsd: 0.18 };

function proposal(name: string, command: string): RuleProposalPayload {
    return {
        name,
        expect: { kind: RULE_EXPECTATION_KIND.command, commandMatches: [command] },
        citedTurnIds: ["turn-1"],
        citedEventIds: ["event-1"],
    };
}

function build(generations: InMemoryRuleGenerationRepository, rules: InMemoryRuleRepository) {
    const clock = new FixedClock(GENERATION_NOW);
    const creation = new RuleCreationService(rules, clock, new SequentialRuleIdGenerator());
    return new SettleRuleGenerationUseCase(generations, clock, creation);
}

describe("SettleRuleGenerationUseCase", () => {
    it("제안을 에이전트 규칙으로 만들고 인용과 출처를 남긴다", async () => {
        const generations = new InMemoryRuleGenerationRepository();
        generations.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));
        const rules = new InMemoryRuleRepository();

        const result = await build(generations, rules).complete({
            userId: "u1",
            id: "gen-1",
            owner: "daemon-1",
            proposals: [proposal("린트 실행", "npm run lint")],
            skipped: ["근거가 서지 않은 제안"],
            observation: OBSERVATION,
            steps: [],
        });

        expect(result.outcome).toBe("settled");
        expect(result.createdRuleIds).toHaveLength(1);
        expect(rules.all()[0]).toMatchObject({
            source: "agent",
            taskId: "task-1",
            anchorEventId: "anchor-1",
            citedTurnIds: ["turn-1"],
            citedEventIds: ["event-1"],
            sourceJobId: "gen-1",
        });
        expect(generations.all()[0]).toMatchObject({
            status: RULE_GENERATION_STATUS.completed,
            skipped: ["근거가 서지 않은 제안"],
            observation: OBSERVATION,
        });
    });

    it("요청이 정한 상한을 넘는 제안은 규칙으로 만들지 않는다", async () => {
        const generations = new InMemoryRuleGenerationRepository();
        generations.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1", maxRules: 1 }));
        const rules = new InMemoryRuleRepository();

        const result = await build(generations, rules).complete({
            userId: "u1",
            id: "gen-1",
            owner: "daemon-1",
            proposals: [proposal("린트 실행", "npm run lint"), proposal("테스트 실행", "npm test")],
            skipped: [],
            observation: OBSERVATION,
            steps: [],
        });

        expect(result.createdRuleIds).toHaveLength(1);
        expect(rules.all()).toHaveLength(1);
    });

    it("리스를 잃은 실행기의 산출물로는 규칙을 만들지 않는다", async () => {
        const generations = new InMemoryRuleGenerationRepository();
        generations.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));
        const rules = new InMemoryRuleRepository();

        const result = await build(generations, rules).complete({
            userId: "u1",
            id: "gen-1",
            owner: "daemon-2",
            proposals: [proposal("린트 실행", "npm run lint")],
            skipped: [],
            observation: OBSERVATION,
            steps: [],
        });

        expect(result.outcome).toBe("lease-lost");
        expect(rules.all()).toHaveLength(0);
    });

    it("실패한 실행도 그때까지 청구한 관측을 요청에 싣는다", async () => {
        const generations = new InMemoryRuleGenerationRepository();
        generations.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));
        const rules = new InMemoryRuleRepository();

        const outcome = await build(generations, rules).fail({
            userId: "u1",
            id: "gen-1",
            owner: "daemon-1",
            message: "실행기가 죽었다",
            observation: OBSERVATION,
            steps: [],
        });

        expect(outcome).toBe("settled");
        expect(generations.all()[0]).toMatchObject({
            status: RULE_GENERATION_STATUS.failed,
            error: "실행기가 죽었다",
            observation: OBSERVATION,
        });
    });
});
