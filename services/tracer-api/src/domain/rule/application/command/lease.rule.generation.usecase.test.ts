import { describe, expect, it } from "vitest";
import { RULE_GENERATION_STATUS } from "@agent-tracer/kernel";
import { FixedClock } from "~tracer-api/domain/rule/port/__fakes__/fixed.clock.js";
import { InMemoryRuleGenerationRepository } from "~tracer-api/domain/rule/port/__fakes__/in-memory.rule.generation.repository.js";
import { GENERATION_NOW, generationRow } from "./rule.generation.fixture.js";
import { LeaseRuleGenerationUseCase } from "./lease.rule.generation.usecase.js";

function useCase(repo: InMemoryRuleGenerationRepository): LeaseRuleGenerationUseCase {
    return new LeaseRuleGenerationUseCase(repo, new FixedClock(GENERATION_NOW));
}

describe("LeaseRuleGenerationUseCase", () => {
    it("먼저 도착한 실행기만 대기 요청을 집는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow());
        const lease = useCase(repo);

        expect(await lease.claim("u1", "gen-1", "daemon-1")).toBe(true);
        expect(await lease.claim("u1", "gen-1", "daemon-2")).toBe(false);
        expect(repo.all()[0]).toMatchObject({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" });
    });

    it("리스를 쥔 실행기만 리스를 살려 둔다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));
        const lease = useCase(repo);

        expect(await lease.renew("u1", "gen-1", "daemon-1")).toEqual({ leaseHeld: true, canceled: false });
        expect(await lease.renew("u1", "gen-1", "daemon-2")).toEqual({ leaseHeld: false, canceled: false });
    });

    it("취소된 요청은 하트비트가 취소를 알린다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.canceled }));

        expect(await useCase(repo).renew("u1", "gen-1", "daemon-1")).toEqual({ leaseHeld: false, canceled: true });
    });

    it("반납한 요청은 대기로 돌아가 다음 실행기가 집는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));
        const lease = useCase(repo);

        expect(await lease.release("u1", "gen-1", "daemon-1")).toBe(true);
        expect(repo.all()[0]).toMatchObject({ status: RULE_GENERATION_STATUS.pending, leaseOwner: null });
        expect(await lease.claim("u1", "gen-1", "daemon-2")).toBe(true);
    });

    it("남의 요청은 존재 여부도 드러내지 않는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow());

        await expect(useCase(repo).claim("other", "gen-1", "daemon-1")).rejects.toThrow("not found");
    });
});
