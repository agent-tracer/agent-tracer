import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
} from "@nestjs/common";
import {
    MONITOR_LEASE_OWNER_HEADER,
    MONITOR_USER_HEADER,
    RULE_GENERATIONS_PATH,
    type RuleGenerationStatus,
} from "@agent-tracer/kernel";
import { CancelRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/cancel.rule.generation.usecase.js";
import { LeaseRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/lease.rule.generation.usecase.js";
import { RequestRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/request.rule.generation.usecase.js";
import { SettleRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/settle.rule.generation.usecase.js";
import { ListRuleGenerationsUseCase } from "~tracer-api/domain/rule/application/query/list.rule.generations.usecase.js";
import {
    completeRuleGenerationBodySchema,
    failRuleGenerationBodySchema,
    listRuleGenerationsQuerySchema,
    requestRuleGenerationBodySchema,
    type CompleteRuleGenerationBody,
    type FailRuleGenerationBody,
    type ListRuleGenerationsQuery,
    type RequestRuleGenerationBody,
} from "~tracer-api/domain/rule/inbound/rule.generation.schema.js";
import { resolveUserId } from "~tracer-api/support/request-user.js";
import { pathParamPipe } from "~tracer-api/support/path-param.pipe.js";
import { SchemaValidationPipe } from "~tracer-api/support/schema.validation.pipe.js";

/** 규칙 생성 요청의 접수와 리스와 종결 HTTP 계약을 제공한다. */
@Controller(RULE_GENERATIONS_PATH)
export class RuleGenerationController {
    constructor(
        private readonly requestGeneration: RequestRuleGenerationUseCase,
        private readonly lease: LeaseRuleGenerationUseCase,
        private readonly settle: SettleRuleGenerationUseCase,
        private readonly cancel: CancelRuleGenerationUseCase,
        private readonly list: ListRuleGenerationsUseCase,
    ) {}

    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    async request(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Body(new SchemaValidationPipe(requestRuleGenerationBodySchema)) body: RequestRuleGenerationBody,
    ) {
        return this.requestGeneration.execute({
            userId: resolveUserId(user),
            taskId: body.taskId,
            anchorEventId: body.anchorEventId,
            ...(body.intent !== undefined ? { intent: body.intent } : {}),
            ...(body.maxRules !== undefined ? { maxRules: body.maxRules } : {}),
        });
    }

    @Get()
    async listRequests(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Query(new SchemaValidationPipe(listRuleGenerationsQuerySchema)) query: ListRuleGenerationsQuery,
    ) {
        return this.list.execute({
            userId: resolveUserId(user),
            ...(query.status !== undefined ? { status: query.status as RuleGenerationStatus } : {}),
            ...(query.taskId !== undefined ? { taskId: query.taskId } : {}),
            ...(query.limit !== undefined ? { limit: query.limit } : {}),
        });
    }

    @Get(":id")
    async getRequest(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Param("id", pathParamPipe) id: string,
    ) {
        return this.list.get(resolveUserId(user), id);
    }

    @Post(":id/claim")
    @HttpCode(HttpStatus.OK)
    async claim(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Headers(MONITOR_LEASE_OWNER_HEADER) owner: string | undefined,
        @Param("id", pathParamPipe) id: string,
    ) {
        const claimed = await this.lease.claim(resolveUserId(user), id, requireOwner(owner));
        return { claimed };
    }

    @Post(":id/heartbeat")
    @HttpCode(HttpStatus.OK)
    async heartbeat(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Headers(MONITOR_LEASE_OWNER_HEADER) owner: string | undefined,
        @Param("id", pathParamPipe) id: string,
    ) {
        return this.lease.renew(resolveUserId(user), id, requireOwner(owner));
    }

    @Post(":id/release")
    @HttpCode(HttpStatus.OK)
    async release(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Headers(MONITOR_LEASE_OWNER_HEADER) owner: string | undefined,
        @Param("id", pathParamPipe) id: string,
    ) {
        const released = await this.lease.release(resolveUserId(user), id, requireOwner(owner));
        return { released };
    }

    @Post(":id/complete")
    @HttpCode(HttpStatus.OK)
    async complete(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Headers(MONITOR_LEASE_OWNER_HEADER) owner: string | undefined,
        @Param("id", pathParamPipe) id: string,
        @Body(new SchemaValidationPipe(completeRuleGenerationBodySchema)) body: CompleteRuleGenerationBody,
    ) {
        return this.settle.complete({
            userId: resolveUserId(user),
            id,
            owner: requireOwner(owner),
            proposals: body.rules,
            skipped: body.skipped,
            observation: body.observation,
            steps: body.steps,
        });
    }

    @Post(":id/fail")
    @HttpCode(HttpStatus.OK)
    async fail(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Headers(MONITOR_LEASE_OWNER_HEADER) owner: string | undefined,
        @Param("id", pathParamPipe) id: string,
        @Body(new SchemaValidationPipe(failRuleGenerationBodySchema)) body: FailRuleGenerationBody,
    ) {
        const outcome = await this.settle.fail({
            userId: resolveUserId(user),
            id,
            owner: requireOwner(owner),
            message: body.message,
            observation: body.observation,
            steps: body.steps,
        });
        return { outcome };
    }

    @Post(":id/cancel")
    @HttpCode(HttpStatus.OK)
    async cancelRequest(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Param("id", pathParamPipe) id: string,
    ) {
        return this.cancel.execute(resolveUserId(user), id);
    }
}

/** 리스 소유자가 없으면 회수된 요청을 남이 종결시킬 수 있으므로 헤더를 강제한다. */
function requireOwner(owner: string | undefined): string {
    const trimmed = owner?.trim() ?? "";
    if (trimmed.length === 0) {
        throw new BadRequestException(`${MONITOR_LEASE_OWNER_HEADER} header is required`);
    }
    return trimmed;
}
