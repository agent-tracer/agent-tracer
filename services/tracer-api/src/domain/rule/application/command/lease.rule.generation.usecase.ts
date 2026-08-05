import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { RULE_GENERATION_STATUS } from "@agent-tracer/kernel";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import {
    RULE_GENERATION_REPOSITORY,
    type RuleGenerationRepositoryPort,
} from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";

/** 실행기가 리스를 쥐고 있는지와 요청이 취소됐는지를 함께 알린다. */
export interface RuleGenerationLeaseState {
    readonly leaseHeld: boolean;
    readonly canceled: boolean;
}

/** 실행기가 요청을 집어 쥐고 살려 두고 놓는 왕복이다. */
@Injectable()
export class LeaseRuleGenerationUseCase {
    constructor(
        @Inject(RULE_GENERATION_REPOSITORY)
        private readonly requests: RuleGenerationRepositoryPort,
        @Inject(CLOCK)
        private readonly clock: ClockPort,
    ) {}

    /** 대기 중인 요청을 실행기에 넘기며 먼저 도착한 실행기만 성공한다. */
    async claim(userId: string, id: string, owner: string): Promise<boolean> {
        await this.owned(userId, id);
        return this.requests.claim(id, owner, this.clock.now());
    }

    /** 리스를 살려 두며 회수됐거나 취소된 요청은 그 사실을 알린다. */
    async renew(userId: string, id: string, owner: string): Promise<RuleGenerationLeaseState> {
        const request = await this.owned(userId, id);
        if (request.status === RULE_GENERATION_STATUS.canceled) {
            return { leaseHeld: false, canceled: true };
        }
        const held = await this.requests.renewLease(id, owner, this.clock.now());
        return { leaseHeld: held, canceled: false };
    }

    /** 실행기가 내려갈 때 요청을 대기로 되돌려 다음 실행기가 집게 한다. */
    async release(userId: string, id: string, owner: string): Promise<boolean> {
        await this.owned(userId, id);
        return this.requests.release(id, owner);
    }

    private async owned(userId: string, id: string) {
        const request = await this.requests.findById(id);
        // 남의 요청은 존재 여부도 드러내지 않는다.
        if (request === null || request.userId !== userId) {
            throw new NotFoundException("Rule generation request not found");
        }
        return request;
    }
}
