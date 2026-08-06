import { In, type Repository } from "typeorm";
import type { TurnReassignmentEntity } from "./turn.reassignment.entity.js";
import { upsertByKeys } from "~tracer-model/persistence/repository.upsert.js";

export class TurnReassignmentRepository {
    constructor(private readonly repo: Repository<TurnReassignmentEntity>) {}

    /** 투영이 배치마다 세션 하나당 한 번만 읽는 조회다. */
    async findBySession(userId: string, sessionId: string): Promise<TurnReassignmentEntity[]> {
        return this.repo.find({ where: { userId, sessionId }, order: { fromTurnIndex: "ASC" } });
    }

    /** 분리된 태스크가 어느 구간에서 왔는지이며 되돌리기와 화면 역링크가 읽는다. */
    async findByTask(userId: string, taskId: string): Promise<TurnReassignmentEntity[]> {
        return this.repo.find({ where: { userId, taskId }, order: { fromTurnIndex: "ASC" } });
    }

    /** 원본 태스크의 피드가 구멍을 설명할 때 읽는다. */
    async findByOriginTask(userId: string, originTaskId: string): Promise<TurnReassignmentEntity[]> {
        return this.repo.find({ where: { userId, originTaskId }, order: { fromTurnIndex: "ASC" } });
    }

    async upsertAll(rows: readonly TurnReassignmentEntity[]): Promise<void> {
        for (const row of rows) await upsertByKeys(this.repo, row, ["id"]);
    }

    async deleteByIds(ids: readonly string[]): Promise<void> {
        if (ids.length === 0) return;
        await this.repo.delete({ id: In([...ids]) });
    }
}
