import { Inject, Injectable } from "@nestjs/common";
import type { DataSource } from "typeorm";
import { aggregateVerdictStatus } from "@agent-tracer/kernel";
import {
    EventEntity,
    EventRepository,
    RuleEntity,
    RuleEvaluator,
    RuleRepository,
    TurnEntity,
    TurnRepository,
    VerdictEntity,
    VerdictRepository,
    type TurnEntity as Turn,
} from "@agent-tracer/tracer-model";
import { TRACER_DATA_SOURCE } from "~tracer-api/config/tracer.datasource.token.js";
import type { VerdictRealignerPort } from "~tracer-api/domain/task/port/verdict.realigner.port.js";
import { CLOCK, type ClockPort } from "~tracer-api/domain/task/port/clock.port.js";

/** 규칙과 판정이 같은 태스크를 가리키게 맞추고 옮겨진 경계 위에서 판정을 다시 계산하는 어댑터다. */
@Injectable()
export class TypeOrmVerdictRealignerAdapter implements VerdictRealignerPort {
    constructor(
        @Inject(TRACER_DATA_SOURCE) private readonly dataSource: DataSource,
        @Inject(CLOCK) private readonly clock: ClockPort,
    ) {}

    async realign(userId: string, movedTurnIds: readonly string[], taskIds: readonly string[]): Promise<number> {
        const repos = this.repositories();
        const stale = await this.dropStaleVerdicts(repos, movedTurnIds);
        for (const taskId of taskIds) await this.backfillTask(repos, userId, taskId);
        for (const turn of stale) await this.resummarize(repos, turn);
        return stale.length;
    }

    private repositories() {
        const manager = this.dataSource.manager;
        return {
            events: new EventRepository(manager.getRepository(EventEntity)),
            turns: new TurnRepository(manager.getRepository(TurnEntity)),
            rules: new RuleRepository(manager.getRepository(RuleEntity)),
            verdicts: new VerdictRepository(manager.getRepository(VerdictEntity)),
            verdictRows: manager.getRepository(VerdictEntity),
        };
    }

    /** 열린 채 남의 턴까지 따라간 판정만 걸리며, 이미 결론난 판정은 그 턴에 머물러 걸리지 않는다. */
    private async dropStaleVerdicts(
        repos: ReturnType<typeof this.repositories>,
        movedTurnIds: readonly string[],
    ): Promise<readonly Turn[]> {
        if (movedTurnIds.length === 0) return [];
        const verdicts = await repos.verdicts.findByTurns(movedTurnIds);
        const orphanedTurns = new Map<string, Turn>();

        for (const verdict of verdicts) {
            const turn = await repos.turns.findById(verdict.turnId);
            if (turn === null) continue;
            const rule = await repos.rules.findById(verdict.ruleId);
            if (rule !== null && rule.taskId === turn.taskId) continue;
            await repos.verdictRows.delete({ ruleId: verdict.ruleId });
            orphanedTurns.set(turn.id, turn);
        }
        return [...orphanedTurns.values()];
    }

    private async backfillTask(
        repos: ReturnType<typeof this.repositories>,
        userId: string,
        taskId: string,
    ): Promise<void> {
        const rules = await repos.rules.findApplicable(userId, taskId);
        if (rules.length === 0) return;

        const turns = await repos.turns.findByTask(userId, taskId);
        const evaluator = new RuleEvaluator(repos);
        const now = this.clock.now();
        for (const rule of rules) {
            for (const turn of turns) {
                // 규칙 하나에 판정 하나이므로 붙잡은 턴을 찾으면 더 볼 필요가 없다.
                if (await evaluator.evaluate(rule, turn, now) !== null) break;
            }
        }
    }

    /** 판정을 잃은 턴은 요약을 다시 계산하지 않으면 사라진 판정의 집계를 계속 보인다. */
    private async resummarize(repos: ReturnType<typeof this.repositories>, turn: Turn): Promise<void> {
        const remaining = await repos.verdicts.findByTurn(turn.id);
        turn.recordVerdictSummary(aggregateVerdictStatus(remaining), remaining.length);
        await repos.turns.upsert(turn);
    }
}
