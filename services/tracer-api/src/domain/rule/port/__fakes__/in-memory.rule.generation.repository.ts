import {
    RULE_GENERATION_LEASE_TTL_MS,
    RULE_GENERATION_STATUS,
    type RuleGenerationStatus,
} from "@agent-tracer/kernel";
import type { RuleGenerationEntity } from "@agent-tracer/tracer-model";
import type {
    RuleGenerationRepositoryPort,
    RuleGenerationSettlement,
} from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";

const ACTIVE: readonly RuleGenerationStatus[] = [RULE_GENERATION_STATUS.pending, RULE_GENERATION_STATUS.running];

export class InMemoryRuleGenerationRepository implements RuleGenerationRepositoryPort {
    private readonly rows = new Map<string, RuleGenerationEntity>();

    seed(request: RuleGenerationEntity): void {
        this.rows.set(request.id, request);
    }

    all(): RuleGenerationEntity[] {
        return [...this.rows.values()];
    }

    async findById(id: string): Promise<RuleGenerationEntity | null> {
        return this.rows.get(id) ?? null;
    }

    async findActiveByAnchor(userId: string, anchorEventId: string): Promise<RuleGenerationEntity | null> {
        return this.all().find(
            (row) => row.userId === userId && row.anchorEventId === anchorEventId && ACTIVE.includes(row.status),
        ) ?? null;
    }

    async findByStatus(userId: string, status: RuleGenerationStatus): Promise<RuleGenerationEntity[]> {
        return this.all().filter((row) => row.userId === userId && row.status === status);
    }

    async findByTask(userId: string, taskId: string, limit: number): Promise<RuleGenerationEntity[]> {
        return this.all().filter((row) => row.userId === userId && row.taskId === taskId).slice(0, limit);
    }

    async findRecent(userId: string, limit: number): Promise<RuleGenerationEntity[]> {
        return this.all().filter((row) => row.userId === userId).slice(0, limit);
    }

    async insert(request: RuleGenerationEntity): Promise<void> {
        this.rows.set(request.id, request);
    }

    async claim(id: string, owner: string, now: Date): Promise<boolean> {
        const row = this.rows.get(id);
        if (row === undefined || row.status !== RULE_GENERATION_STATUS.pending) return false;
        row.status = RULE_GENERATION_STATUS.running;
        row.leaseOwner = owner;
        row.leaseExpiresAt = new Date(now.getTime() + RULE_GENERATION_LEASE_TTL_MS);
        row.startedAt = now;
        return true;
    }

    async renewLease(id: string, owner: string, now: Date): Promise<boolean> {
        const row = this.rows.get(id);
        if (row === undefined || row.status !== RULE_GENERATION_STATUS.running || row.leaseOwner !== owner) return false;
        row.leaseExpiresAt = new Date(now.getTime() + RULE_GENERATION_LEASE_TTL_MS);
        return true;
    }

    async settleWithLease(
        id: string,
        owner: string,
        settlement: RuleGenerationSettlement,
        now: Date,
    ): Promise<boolean> {
        const row = this.rows.get(id);
        if (row === undefined || row.status !== RULE_GENERATION_STATUS.running || row.leaseOwner !== owner) return false;
        row.status = settlement.status;
        row.observation = settlement.observation;
        row.steps = [...settlement.steps];
        row.skipped = [...settlement.skipped];
        row.createdRuleIds = [...settlement.createdRuleIds];
        row.error = settlement.error;
        row.leaseOwner = null;
        row.leaseExpiresAt = null;
        row.finishedAt = now;
        return true;
    }

    async release(id: string, owner: string): Promise<boolean> {
        const row = this.rows.get(id);
        if (row === undefined || row.status !== RULE_GENERATION_STATUS.running || row.leaseOwner !== owner) return false;
        row.status = RULE_GENERATION_STATUS.pending;
        row.leaseOwner = null;
        row.leaseExpiresAt = null;
        row.startedAt = null;
        return true;
    }

    async cancel(userId: string, id: string, now: Date): Promise<boolean> {
        const row = this.rows.get(id);
        if (row === undefined || row.userId !== userId || !ACTIVE.includes(row.status)) return false;
        row.status = RULE_GENERATION_STATUS.canceled;
        row.leaseOwner = null;
        row.leaseExpiresAt = null;
        row.finishedAt = now;
        return true;
    }

    async deleteTerminal(userId: string, id: string): Promise<boolean> {
        const row = this.rows.get(id);
        if (row === undefined || row.userId !== userId || ACTIVE.includes(row.status)) return false;
        this.rows.delete(id);
        return true;
    }

    async deleteAllTerminal(userId: string): Promise<number> {
        let deleted = 0;
        for (const row of this.all()) {
            if (row.userId !== userId || ACTIVE.includes(row.status)) continue;
            this.rows.delete(row.id);
            deleted += 1;
        }
        return deleted;
    }

    async reclaimExpired(now: Date): Promise<number> {
        let reclaimed = 0;
        for (const row of this.all()) {
            if (row.status !== RULE_GENERATION_STATUS.running) continue;
            if (row.leaseExpiresAt === null || row.leaseExpiresAt.getTime() > now.getTime()) continue;
            row.status = RULE_GENERATION_STATUS.pending;
            row.leaseOwner = null;
            row.leaseExpiresAt = null;
            row.startedAt = null;
            reclaimed += 1;
        }
        return reclaimed;
    }
}
