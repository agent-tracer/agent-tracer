import { In, LessThanOrEqual } from "typeorm";
import type { Repository } from "typeorm";
import {
    RULE_GENERATION_LEASE_TTL_MS,
    RULE_GENERATION_STATUS,
    type RuleGenerationStatus,
} from "@agent-tracer/kernel";
import type { RuleGenerationEntity } from "./rule.generation.entity.js";

const ACTIVE_STATUSES: readonly RuleGenerationStatus[] = [
    RULE_GENERATION_STATUS.pending,
    RULE_GENERATION_STATUS.running,
];

const TERMINAL_STATUSES: readonly RuleGenerationStatus[] = [
    RULE_GENERATION_STATUS.completed,
    RULE_GENERATION_STATUS.failed,
    RULE_GENERATION_STATUS.canceled,
];

/** 종결 창구가 요청에 싣는 값이다. */
export interface RuleGenerationSettlement {
    readonly status: RuleGenerationStatus;
    readonly observation: RuleGenerationEntity["observation"];
    readonly steps: RuleGenerationEntity["steps"];
    readonly skipped: readonly string[];
    readonly createdRuleIds: readonly string[];
    readonly error: string | null;
}

export class RuleGenerationRepository {
    constructor(private readonly repo: Repository<RuleGenerationEntity>) {}

    async findById(id: string): Promise<RuleGenerationEntity | null> {
        return this.repo.findOne({ where: { id } });
    }

    /** 같은 앵커로 이미 도는 요청이며 멱등의 근거다. */
    async findActiveByAnchor(userId: string, anchorEventId: string): Promise<RuleGenerationEntity | null> {
        return this.repo.findOne({ where: { userId, anchorEventId, status: In([...ACTIVE_STATUSES]) } });
    }

    async findByStatus(userId: string, status: RuleGenerationStatus): Promise<RuleGenerationEntity[]> {
        return this.repo.find({ where: { userId, status }, order: { createdAt: "ASC" } });
    }

    async findByTask(userId: string, taskId: string, limit: number): Promise<RuleGenerationEntity[]> {
        return this.repo.find({ where: { userId, taskId }, order: { createdAt: "DESC" }, take: limit });
    }

    async findRecent(userId: string, limit: number): Promise<RuleGenerationEntity[]> {
        return this.repo.find({ where: { userId }, order: { createdAt: "DESC" }, take: limit });
    }

    async insert(request: RuleGenerationEntity): Promise<void> {
        await this.repo.insert(request);
    }

    /** 대기 중인 요청 하나를 실행기에 넘기며 먼저 도착한 실행기만 성공한다. */
    async claim(id: string, owner: string, now: Date): Promise<boolean> {
        const result = await this.repo.update(
            { id, status: RULE_GENERATION_STATUS.pending },
            {
                status: RULE_GENERATION_STATUS.running,
                leaseOwner: owner,
                leaseExpiresAt: new Date(now.getTime() + RULE_GENERATION_LEASE_TTL_MS),
                startedAt: now,
            },
        );
        return (result.affected ?? 0) > 0;
    }

    /** 리스를 살려 두며 회수됐거나 취소된 요청에는 실패한다. */
    async renewLease(id: string, owner: string, now: Date): Promise<boolean> {
        const result = await this.repo.update(
            { id, status: RULE_GENERATION_STATUS.running, leaseOwner: owner },
            { leaseExpiresAt: new Date(now.getTime() + RULE_GENERATION_LEASE_TTL_MS) },
        );
        return (result.affected ?? 0) > 0;
    }

    /** 리스를 쥔 실행기만 종결하며 회수된 요청은 덮어쓰지 않는다. */
    async settleWithLease(
        id: string,
        owner: string,
        settlement: RuleGenerationSettlement,
        now: Date,
    ): Promise<boolean> {
        const result = await this.repo.update(
            { id, status: RULE_GENERATION_STATUS.running, leaseOwner: owner },
            {
                status: settlement.status,
                observation: settlement.observation,
                steps: settlement.steps,
                skipped: [...settlement.skipped],
                createdRuleIds: [...settlement.createdRuleIds],
                error: settlement.error,
                leaseOwner: null,
                leaseExpiresAt: null,
                finishedAt: now,
            },
        );
        return (result.affected ?? 0) > 0;
    }

    /** 실행기가 내려갈 때 요청을 대기로 되돌린다. */
    async release(id: string, owner: string): Promise<boolean> {
        const result = await this.repo.update(
            { id, status: RULE_GENERATION_STATUS.running, leaseOwner: owner },
            { status: RULE_GENERATION_STATUS.pending, leaseOwner: null, leaseExpiresAt: null, startedAt: null },
        );
        return (result.affected ?? 0) > 0;
    }

    async cancel(userId: string, id: string, now: Date): Promise<boolean> {
        const result = await this.repo.update(
            { id, userId, status: In([...ACTIVE_STATUSES]) },
            {
                status: RULE_GENERATION_STATUS.canceled,
                leaseOwner: null,
                leaseExpiresAt: null,
                finishedAt: now,
            },
        );
        return (result.affected ?? 0) > 0;
    }

    /** 실행기가 종결시킬 자리를 잃지 않도록 종료된 요청만 이력에서 지운다. */
    async deleteTerminal(userId: string, id: string): Promise<boolean> {
        const result = await this.repo.delete({ id, userId, status: In([...TERMINAL_STATUSES]) });
        return (result.affected ?? 0) > 0;
    }

    /** 종료된 요청을 모두 지우고 지운 수를 돌려준다. */
    async deleteAllTerminal(userId: string): Promise<number> {
        const result = await this.repo.delete({ userId, status: In([...TERMINAL_STATUSES]) });
        return result.affected ?? 0;
    }

    /** 리스가 끊긴 채 남은 요청을 대기로 돌려 다음 실행기가 집을 수 있게 한다. */
    async reclaimExpired(now: Date): Promise<number> {
        const result = await this.repo.update(
            { status: RULE_GENERATION_STATUS.running, leaseExpiresAt: LessThanOrEqual(now) },
            { status: RULE_GENERATION_STATUS.pending, leaseOwner: null, leaseExpiresAt: null, startedAt: null },
        );
        return result.affected ?? 0;
    }
}
