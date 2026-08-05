import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { isTerminalRuleGenerationStatus } from "@agent-tracer/kernel";
import {
    RULE_GENERATION_REPOSITORY,
    type RuleGenerationRepositoryPort,
} from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";

/** 도는 요청을 지우면 그 실행의 관측과 궤적이 영원히 비므로 종료된 요청만 이력에서 지운다. */
@Injectable()
export class DeleteRuleGenerationUseCase {
    constructor(
        @Inject(RULE_GENERATION_REPOSITORY)
        private readonly requests: RuleGenerationRepositoryPort,
    ) {}

    async execute(userId: string, id: string): Promise<{ readonly deleted: boolean }> {
        const request = await this.requests.findById(id);
        if (request === null || request.userId !== userId) {
            throw new NotFoundException("Rule generation request not found");
        }
        if (!isTerminalRuleGenerationStatus(request.status)) {
            throw new ConflictException("Cancel the running request before deleting it");
        }
        return { deleted: await this.requests.deleteTerminal(userId, id) };
    }

    /** 도는 요청은 남기고 끝난 것만 비운다. */
    async clear(userId: string): Promise<{ readonly deleted: number }> {
        return { deleted: await this.requests.deleteAllTerminal(userId) };
    }
}
