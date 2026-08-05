import { describe, expect, it } from "vitest";
import { RULE_GENERATION_STATUS } from "@agent-tracer/kernel";
import { FixedClock } from "~tracer-api/domain/rule/port/__fakes__/fixed.clock.js";
import { InMemoryRuleGenerationRepository } from "~tracer-api/domain/rule/port/__fakes__/in-memory.rule.generation.repository.js";
import { CancelRuleGenerationUseCase } from "./cancel.rule.generation.usecase.js";
import { GENERATION_NOW, generationRow } from "./rule.generation.fixture.js";

function useCase(repo: InMemoryRuleGenerationRepository): CancelRuleGenerationUseCase {
    return new CancelRuleGenerationUseCase(repo, new FixedClock(GENERATION_NOW));
}

describe("CancelRuleGenerationUseCase", () => {
    it("대기 중인 요청을 멈춘다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow());

        const result = await useCase(repo).execute("u1", "gen-1");

        expect(result.canceled).toBe(true);
        expect(result.request.status).toBe(RULE_GENERATION_STATUS.canceled);
    });

    it("실행 중인 요청도 멈추고 리스를 거둔다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));

        await useCase(repo).execute("u1", "gen-1");

        expect(repo.all()[0]).toMatchObject({ status: RULE_GENERATION_STATUS.canceled, leaseOwner: null });
    });

    it("이미 종결된 요청은 상태를 바꾸지 않는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.completed }));

        const result = await useCase(repo).execute("u1", "gen-1");

        expect(result.canceled).toBe(false);
        expect(result.request.status).toBe(RULE_GENERATION_STATUS.completed);
    });

    it("남의 요청은 존재 여부도 드러내지 않는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow());

        await expect(useCase(repo).execute("other", "gen-1")).rejects.toThrow("not found");
    });
});
