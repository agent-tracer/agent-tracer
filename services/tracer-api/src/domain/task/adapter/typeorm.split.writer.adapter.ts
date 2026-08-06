import { Inject, Injectable } from "@nestjs/common";
import { Between, In, type DataSource } from "typeorm";
import {
    EventEntity,
    RecipeApplicationEntity,
    RuleEntity,
    TaskEntity,
    TurnEntity,
} from "@agent-tracer/tracer-model";
import { TRACER_DATA_SOURCE } from "~tracer-api/config/tracer.datasource.token.js";
import type { SplitWriterPort } from "~tracer-api/domain/task/port/split.write.port.js";

/** 분리가 조회 모델에 즉시 반영해야 하는 일괄 갱신을 한 트랜잭션으로 묶는 어댑터다. */
@Injectable()
export class TypeOrmSplitWriterAdapter implements SplitWriterPort {
    constructor(@Inject(TRACER_DATA_SOURCE) private readonly dataSource: DataSource) {}

    async moveTurns(
        userId: string,
        sessionId: string,
        fromTurnIndex: number,
        toTurnIndex: number,
        taskId: string,
    ): Promise<readonly string[]> {
        return this.dataSource.transaction(async (manager) => {
            const turns = await manager.getRepository(TurnEntity).find({
                where: { userId, sessionId, turnIndex: Between(fromTurnIndex, toTurnIndex) },
                select: { id: true },
            });
            const turnIds = turns.map((turn) => turn.id);
            if (turnIds.length === 0) return [];

            await manager.getRepository(TurnEntity).update({ id: In(turnIds) }, { taskId });
            await manager.getRepository(EventEntity).update({ userId, turnId: In(turnIds) }, { taskId });
            return turnIds;
        });
    }

    // 자식이 어느 턴에 속하는지는 그 자식을 띄운 이벤트의 턴이 정한다.
    async moveChildTasks(userId: string, turnIds: readonly string[], taskId: string): Promise<number> {
        const tasks = this.dataSource.getRepository(TaskEntity);
        const childIds = await this.childTaskIds(userId, turnIds);
        if (childIds.length === 0) return 0;
        const result = await tasks.update({ userId, id: In(childIds) }, { parentTaskId: taskId });
        return result.affected ?? 0;
    }

    async moveRuleAnchors(userId: string, turnIds: readonly string[], taskId: string): Promise<number> {
        const anchorIds = await this.anchorEventIds(userId, turnIds);
        if (anchorIds.length === 0) return 0;

        const rules = await this.dataSource
            .getRepository(RuleEntity)
            .update({ userId, anchorEventId: In(anchorIds) }, { taskId });
        const applications = await this.dataSource
            .getRepository(RecipeApplicationEntity)
            .update({ userId, anchorEventId: In(anchorIds) }, { taskId });
        return (rules.affected ?? 0) + (applications.affected ?? 0);
    }

    async refreshTaskActivity(userId: string, taskIds: readonly string[]): Promise<void> {
        const tasks = this.dataSource.getRepository(TaskEntity);
        for (const taskId of taskIds) {
            const [latest] = await this.dataSource.getRepository(EventEntity).find({
                where: { userId, taskId },
                order: { occurredAt: "DESC" },
                take: 1,
                select: { occurredAt: true },
            });
            await tasks.update({ userId, id: taskId }, { lastEventAt: latest?.occurredAt ?? null });
        }
    }

    async deleteTask(userId: string, taskId: string): Promise<void> {
        await this.dataSource.getRepository(TaskEntity).delete({ userId, id: taskId });
    }

    // 자식 태스크는 자기가 태어난 시각이 어느 턴의 창에 드는지로 소속 턴이 정해진다.
    private async childTaskIds(userId: string, turnIds: readonly string[]): Promise<string[]> {
        const rows = await this.dataSource
            .getRepository(TaskEntity)
            .createQueryBuilder("t")
            .select("t.id", "id")
            .innerJoin(
                TurnEntity,
                "tn",
                "tn.session_id = t.parent_session_id AND tn.user_id = t.user_id",
            )
            .where("t.user_id = :userId", { userId })
            .andWhere("tn.id IN (:...turnIds)", { turnIds: [...turnIds] })
            .andWhere("t.parent_task_id IS NOT NULL")
            .andWhere("t.created_at >= tn.started_at")
            .andWhere("(tn.ended_at IS NULL OR t.created_at <= tn.ended_at)")
            .getRawMany<{ id: string }>();
        return [...new Set(rows.map((row) => row.id))];
    }

    private async anchorEventIds(userId: string, turnIds: readonly string[]): Promise<string[]> {
        const rows = await this.dataSource
            .getRepository(EventEntity)
            .find({ where: { userId, turnId: In([...turnIds]) }, select: { id: true } });
        return rows.map((row) => row.id);
    }
}
