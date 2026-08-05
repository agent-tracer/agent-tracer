import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Put } from "@nestjs/common";
import { MONITOR_USER_HEADER, RULE_GENERATION_SETTINGS_PATH } from "@agent-tracer/kernel";
import {
    SaveRuleGenerationSettingsUseCase,
    type RuleGenerationSettingsPatch,
} from "~tracer-api/domain/rule/application/command/save.rule.generation.settings.usecase.js";
import {
    ruleGenerationSettingsBodySchema,
    type RuleGenerationSettingsBody,
} from "~tracer-api/domain/rule/inbound/rule.generation.settings.schema.js";
import { resolveUserId } from "~tracer-api/support/request-user.js";
import { SchemaValidationPipe } from "~tracer-api/support/schema.validation.pipe.js";

/** 규칙 생성 설정의 HTTP 계약을 제공하며 에이전트 서비스가 없어도 산다. */
@Controller(RULE_GENERATION_SETTINGS_PATH)
export class RuleGenerationSettingsController {
    constructor(private readonly settings: SaveRuleGenerationSettingsUseCase) {}

    @Get()
    async read(@Headers(MONITOR_USER_HEADER) user: string | undefined) {
        return this.settings.read(resolveUserId(user));
    }

    @Put()
    @HttpCode(HttpStatus.OK)
    async save(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Body(new SchemaValidationPipe(ruleGenerationSettingsBodySchema)) body: RuleGenerationSettingsBody,
    ) {
        return this.settings.save(resolveUserId(user), body as RuleGenerationSettingsPatch);
    }
}
