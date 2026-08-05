import type { Repository } from "typeorm";
import type { RuleGenerationSettingsEntity } from "./rule.generation.settings.entity.js";
import { upsertByKeys } from "~tracer-model/persistence/repository.upsert.js";

export class RuleGenerationSettingsRepository {
    constructor(private readonly repo: Repository<RuleGenerationSettingsEntity>) {}

    async findByUser(userId: string): Promise<RuleGenerationSettingsEntity | null> {
        return this.repo.findOne({ where: { userId } });
    }

    async upsert(settings: RuleGenerationSettingsEntity): Promise<void> {
        await upsertByKeys(this.repo, settings, ["userId"]);
    }
}
