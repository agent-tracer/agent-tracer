import { describe, expect, it } from "vitest";
import { RULE_GENERATION_LEASE_TTL_MS, RULE_GENERATION_STATUS } from "@agent-tracer/kernel";
import { FixedClock } from "~tracer-api/domain/rule/port/__fakes__/fixed.clock.js";
import { InMemoryRuleGenerationRepository } from "~tracer-api/domain/rule/port/__fakes__/in-memory.rule.generation.repository.js";
import {
    GENERATION_NOW,
    generationRow,
} from "~tracer-api/domain/rule/application/command/rule.generation.fixture.js";
import { ListRuleGenerationsUseCase } from "./list.rule.generations.usecase.js";

describe("ListRuleGenerationsUseCase", () => {
    it("대기 목록을 낼 때 리스가 끊긴 요청을 먼저 대기로 돌린다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ id: "gen-1", status: RULE_GENERATION_STATUS.running, leaseOwner: "죽은-데몬" }));
        const clock = new FixedClock(new Date(GENERATION_NOW.getTime() + RULE_GENERATION_LEASE_TTL_MS + 1));

        const result = await new ListRuleGenerationsUseCase(repo, clock).execute({
            userId: "u1",
            status: RULE_GENERATION_STATUS.pending,
        });

        expect(result.items.map((item) => item.id)).toEqual(["gen-1"]);
        expect(repo.all()[0]).toMatchObject({ status: RULE_GENERATION_STATUS.pending, leaseOwner: null });
    });

    it("살아 있는 리스는 거두지 않는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ status: RULE_GENERATION_STATUS.running, leaseOwner: "daemon-1" }));

        const result = await new ListRuleGenerationsUseCase(repo, new FixedClock(GENERATION_NOW)).execute({
            userId: "u1",
            status: RULE_GENERATION_STATUS.pending,
        });

        expect(result.items).toEqual([]);
        expect(repo.all()[0]?.status).toBe(RULE_GENERATION_STATUS.running);
    });

    it("태스크를 지목하면 그 태스크의 요청만 낸다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow({ id: "gen-1", taskId: "task-1" }));
        repo.seed(generationRow({ id: "gen-2", taskId: "task-2", anchorEventId: "anchor-2" }));

        const result = await new ListRuleGenerationsUseCase(repo, new FixedClock(GENERATION_NOW)).execute({
            userId: "u1",
            taskId: "task-2",
        });

        expect(result.items.map((item) => item.id)).toEqual(["gen-2"]);
    });

    it("요청 하나를 펼치면 궤적까지 함께 준다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        const row = generationRow();
        row.steps = [{ seq: 0, role: "assistant", content: "규칙을 뽑는다" }];
        repo.seed(row);

        const result = await new ListRuleGenerationsUseCase(repo, new FixedClock(GENERATION_NOW)).get("u1", "gen-1");

        expect(result.request.steps).toHaveLength(1);
    });

    it("남의 요청은 존재 여부도 드러내지 않는다", async () => {
        const repo = new InMemoryRuleGenerationRepository();
        repo.seed(generationRow());

        await expect(
            new ListRuleGenerationsUseCase(repo, new FixedClock(GENERATION_NOW)).get("other", "gen-1"),
        ).rejects.toThrow("not found");
    });
});
