import { describe, expect, it } from "vitest";
import { RULE_GENERATION_STATUS } from "@agent-tracer/kernel";
import { InMemoryRuleGenerationRepository } from "~tracer-api/domain/rule/port/__fakes__/in-memory.rule.generation.repository.js";
import { DeleteRuleGenerationUseCase } from "./delete.rule.generation.usecase.js";
import { generationRow } from "./rule.generation.fixture.js";

function useCase(repo: InMemoryRuleGenerationRepository): DeleteRuleGenerationUseCase {
    return new DeleteRuleGenerationUseCase(repo);
}

describe("DeleteRuleGenerationUseCase", () => {
    it("끝난 요청을 이력에서 지운다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.completed }));

        const result = await useCase(repo).execute("u1", "gen-1");

        expect(result.deleted).toBe(true);
        expect(repo.all()).toHaveLength(0);
    });

    it("도는 요청은 실행기가 종결할 자리를 잃으므로 지우지 않는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));

        await expect(useCase(repo).execute("u1", "gen-1")).rejects.toThrow(/Cancel/);
        expect(repo.all()).toHaveLength(1);
    });

    it("남의 요청은 지우지 못한다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.completed }));

        await expect(useCase(repo).execute("u2", "gen-1")).rejects.toThrow(/not found/);
        expect(repo.all()).toHaveLength(1);
    });

    it("이력을 비워도 도는 요청은 남긴다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ id: "gen-1", status: RULE_GENERATION_STATUS.completed }));
        repo.seed(generationRow({ id: "gen-2", status: RULE_GENERATION_STATUS.failed }));
        repo.seed(generationRow({ id: "gen-3", status: RULE_GENERATION_STATUS.running }));

        const result = await useCase(repo).clear("u1");

        expect(result.deleted).toBe(2);
        expect(repo.all().map((row) => row.id)).toEqual(["gen-3"]);
    });
});
