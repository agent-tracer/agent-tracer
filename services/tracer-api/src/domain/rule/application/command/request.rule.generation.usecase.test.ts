import { describe, expect, it } from "vitest";
import { RULE_GENERATION_STATUS } from "@agent-tracer/kernel";
import { FixedClock } from "~tracer-api/domain/rule/port/__fakes__/fixed.clock.js";
import { InMemoryRuleGenerationRepository } from "~tracer-api/domain/rule/port/__fakes__/in-memory.rule.generation.repository.js";
import { SequentialRuleIdGenerator } from "~tracer-api/domain/rule/port/__fakes__/sequential.rule.id.generator.js";
import { GENERATION_NOW, generationRow } from "./rule.generation.fixture.js";
import { RequestRuleGenerationUseCase } from "./request.rule.generation.usecase.js";

function useCase(repo: InMemoryRuleGenerationRepository): RequestRuleGenerationUseCase {
    return new RequestRuleGenerationUseCase(repo, new FixedClock(GENERATION_NOW), new SequentialRuleIdGenerator());
}

describe("RequestRuleGenerationUseCase", () => {
    it("앵커 하나에 대기 중인 요청을 만든다", async () => {
        const repo = new InMemoryRuleGenerationRepository();

        const result = await useCase(repo).execute({
            userId: "u1",
            taskId: "task-1",
            anchorEventId: "anchor-1",
            intent: "  테스트를 먼저 쓴다  ",
            maxRules: 3,
        });

        expect(result.created).toBe(true);
        expect(result.request).toMatchObject({
            taskId: "task-1",
            anchorEventId: "anchor-1",
            intent: "테스트를 먼저 쓴다",
            maxRules: 3,
            status: RULE_GENERATION_STATUS.pending,
        });
        expect(repo.all()).toHaveLength(1);
    });

    it("같은 앵커로 도는 요청이 있으면 그것을 그대로 돌려준다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ id: "gen-1", status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));

        const result = await useCase(repo).execute({ userId: "u1", taskId: "task-1", anchorEventId: "anchor-1" });

        expect(result.created).toBe(false);
        expect(result.request.id).toBe("gen-1");
        expect(repo.all()).toHaveLength(1);
    });

    it("종결된 요청이 있으면 같은 앵커로 다시 만든다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ id: "gen-1", status: RULE_GENERATION_STATUS.completed }));

        const result = await useCase(repo).execute({ userId: "u1", taskId: "task-1", anchorEventId: "anchor-1" });

        expect(result.created).toBe(true);
        expect(repo.all()).toHaveLength(2);
    });

    it("규칙 상한은 계약이 정한 값까지만 받는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();

        const result = await useCase(repo).execute({
            userId: "u1",
            taskId: "task-1",
            anchorEventId: "anchor-1",
            maxRules: 999,
        });

        expect(result.request.maxRules).toBe(20);
    });

    it("공백뿐인 의도는 없는 것으로 본다", async () => {
        const repo = new InMemoryRuleGenerationRepository();

        const result = await useCase(repo).execute({
            userId: "u1",
            taskId: "task-1",
            anchorEventId: "anchor-1",
            intent: "   ",
        });

        expect(result.request.intent).toBeNull();
    });
});
