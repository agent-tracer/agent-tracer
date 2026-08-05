import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { RULE_GENERATION_STATUS, type RuleGenerationStatus } from "@agent-tracer/kernel";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import {
    RULE_GENERATION_REPOSITORY,
    type RuleGenerationRepositoryPort,
} from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";
import {
    mapRuleGeneration,
    mapRuleGenerationDetail,
    type RuleGenerationDetailDto,
    type RuleGenerationDto,
} from "~tracer-api/domain/rule/model/rule.generation.model.js";

const DEFAULT_LIMIT = 20;

export interface ListRuleGenerationsQuery {
    readonly userId: string;
    readonly status?: RuleGenerationStatus;
    readonly taskId?: string;
    readonly limit?: number;
}

/** 실행기는 대기 목록을, 화면은 태스크와 최근 목록을 같은 창구에서 읽는다. */
@Injectable()
export class ListRuleGenerationsUseCase {
    constructor(
        @Inject(RULE_GENERATION_REPOSITORY)
        private readonly requests: RuleGenerationRepositoryPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
    ) {}

    async execute(query: ListRuleGenerationsQuery): Promise<{ readonly items: readonly RuleGenerationDto[] }> {
        // 리스가 끊긴 채 남은 요청을 먼저 돌려야 실행기가 그것을 다시 집을 수 있다.
        if (query.status === RULE_GENERATION_STATUS.pending) {
            await this.requests.reclaimExpired(this.clock.now());
        }
        const limit = query.limit ?? DEFAULT_LIMIT;
        if (query.status !== undefined) {
            const byStatus = await this.requests.findByStatus(query.userId, query.status);
            const scoped = query.taskId === undefined
                ? byStatus
                : byStatus.filter((request) => request.taskId === query.taskId);
            return { items: scoped.map(mapRuleGeneration) };
        }
        const items = query.taskId === undefined
            ? await this.requests.findRecent(query.userId, limit)
            : await this.requests.findByTask(query.userId, query.taskId, limit);
        return { items: items.map(mapRuleGeneration) };
    }

    async get(userId: string, id: string): Promise<{ readonly request: RuleGenerationDetailDto }> {
        const request = await this.requests.findById(id);
        if (request === null || request.userId !== userId) {
            throw new NotFoundException("Rule generation request not found");
        }
        return { request: mapRuleGenerationDetail(request) };
    }
}
