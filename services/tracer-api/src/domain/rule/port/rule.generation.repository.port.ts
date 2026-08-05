import type {
    RuleGenerationEntity,
    RuleGenerationSettlement,
} from "@agent-tracer/tracer-model";
import type { RuleGenerationStatus } from "@agent-tracer/kernel";

export const RULE_GENERATION_REPOSITORY = Symbol("RuleGenerationRepository");

export type { RuleGenerationSettlement };

/** 규칙 생성 요청의 조회와 상태 전이를 제공하는 애플리케이션 포트다. */
export interface RuleGenerationRepositoryPort {
    findById(id: string): Promise<RuleGenerationEntity | null>;
    /** 같은 앵커로 이미 도는 요청이며 멱등의 근거다. */
    findActiveByAnchor(userId: string, anchorEventId: string): Promise<RuleGenerationEntity | null>;
    findByStatus(userId: string, status: RuleGenerationStatus): Promise<RuleGenerationEntity[]>;
    findByTask(userId: string, taskId: string, limit: number): Promise<RuleGenerationEntity[]>;
    findRecent(userId: string, limit: number): Promise<RuleGenerationEntity[]>;
    insert(request: RuleGenerationEntity): Promise<void>;
    claim(id: string, owner: string, now: Date): Promise<boolean>;
    renewLease(id: string, owner: string, now: Date): Promise<boolean>;
    settleWithLease(
        id: string,
        owner: string,
        settlement: RuleGenerationSettlement,
        now: Date,
    ): Promise<boolean>;
    release(id: string, owner: string): Promise<boolean>;
    cancel(userId: string, id: string, now: Date): Promise<boolean>;
    /** 리스가 끊긴 채 남은 요청을 대기로 돌린다. */
    reclaimExpired(now: Date): Promise<number>;
}
