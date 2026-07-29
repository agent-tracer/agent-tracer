import type { Repository } from "typeorm";
import type { SessionEntity } from "./session.entity.js";
import { upsertByKeys } from "../persistence/repository.upsert.js";

export class SessionRepository {
    constructor(private readonly repo: Repository<SessionEntity>) {}

    async findById(id: string): Promise<SessionEntity | null> {
        return this.repo.findOne({ where: { id } });
    }

    async findByTask(userId: string, taskId: string): Promise<SessionEntity[]> {
        return this.repo.find({ where: { userId, taskId }, order: { startedAt: "DESC" } });
    }

    async upsert(session: SessionEntity): Promise<void> {
        await upsertByKeys(this.repo, session, ["id"]);
    }
}
