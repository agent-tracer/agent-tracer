import { In, type Repository } from "typeorm";
import type { TaskUserStateEntity } from "./task.user.state.entity.js";
import { upsertByKeys } from "~tracer-model/persistence/repository.upsert.js";

export class TaskUserStateRepository {
    constructor(private readonly repo: Repository<TaskUserStateEntity>) {}

    async findById(userId: string, taskId: string): Promise<TaskUserStateEntity | null> {
        return this.repo.findOne({ where: { userId, taskId } });
    }

    async findByIds(userId: string, taskIds: readonly string[]): Promise<TaskUserStateEntity[]> {
        if (taskIds.length === 0) return [];
        return this.repo.find({ where: { userId, taskId: In([...taskIds]) } });
    }

    async findByUser(userId: string): Promise<TaskUserStateEntity[]> {
        return this.repo.find({ where: { userId } });
    }

    async save(state: TaskUserStateEntity): Promise<void> {
        await upsertByKeys(this.repo, state, ["userId", "taskId"]);
    }
}
