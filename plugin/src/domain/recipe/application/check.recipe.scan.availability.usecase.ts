import type {RecipeScanJobPort} from "~plugin/domain/recipe/port/recipe.scan.job.port.js";

/** tools/list가 request_recipe_scan을 광고할지 정할 때, 그 잡을 받는 서비스가 배포에 있는지 확인한다. */
export class CheckRecipeScanAvailabilityUsecase {
    constructor(private readonly jobs: RecipeScanJobPort) {}

    async execute(): Promise<boolean> {
        try {
            return await this.jobs.isAvailable();
        } catch {
            return true;
        }
    }
}
