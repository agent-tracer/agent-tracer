import {describe, expect, it} from "vitest";
import {CheckRecipeScanAvailabilityUsecase} from "~plugin/domain/recipe/application/check.recipe.scan.availability.usecase.js";
import {InMemoryRecipeScanJob} from "~plugin/domain/recipe/port/__fakes__/in-memory.recipe.scan.job.js";

describe("CheckRecipeScanAvailabilityUsecase", () => {
    it("잡을 접수하는 서비스가 배포에 있으면 사용 가능하다고 답한다", async () => {
        const jobs = new InMemoryRecipeScanJob();

        expect(await new CheckRecipeScanAvailabilityUsecase(jobs).execute()).toBe(true);
    });

    it("잡을 접수하는 서비스가 배포에 없으면 사용할 수 없다고 답한다", async () => {
        const jobs = new InMemoryRecipeScanJob();
        jobs.markUnavailable();

        expect(await new CheckRecipeScanAvailabilityUsecase(jobs).execute()).toBe(false);
    });

    it("확인 자체가 예외로 튀면 감추지 않고 있다고 본다", async () => {
        const jobs = new InMemoryRecipeScanJob();
        jobs.isAvailable = () => {
            throw new Error("network down");
        };

        expect(await new CheckRecipeScanAvailabilityUsecase(jobs).execute()).toBe(true);
    });
});
