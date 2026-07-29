import { SystemClock } from "@agent-tracer/platform";
import { EventRepository, RuleRepository, TurnRepository, VerdictRepository } from "@agent-tracer/tracer-model";
import { RuleUlidGenerator } from "~tracer-api/domain/rule/adapter/rule.ulid.generator.js";
import { CreateRuleUseCase } from "~tracer-api/domain/rule/application/command/create.rule.usecase.js";
import { DeleteRuleUseCase } from "~tracer-api/domain/rule/application/command/delete.rule.usecase.js";
import { UpdateRuleUseCase } from "~tracer-api/domain/rule/application/command/update.rule.usecase.js";
import { GetRuleEvidenceUseCase } from "~tracer-api/domain/rule/application/query/get.rule.evidence.usecase.js";
import { ListRulesUseCase } from "~tracer-api/domain/rule/application/query/list.rules.usecase.js";
import { CLOCK } from "~tracer-api/domain/rule/port/clock.port.js";
import { RULE_EVENT_READER } from "~tracer-api/domain/rule/port/event.reader.port.js";
import { RULE_ID_GENERATOR } from "~tracer-api/domain/rule/port/rule.id.generator.port.js";
import { RULE_REPOSITORY } from "~tracer-api/domain/rule/port/rule.repository.port.js";
import { RULE_TURN_REPOSITORY } from "~tracer-api/domain/rule/port/turn.repository.port.js";
import { RULE_VERDICT_REPOSITORY } from "~tracer-api/domain/rule/port/verdict.repository.port.js";
import { RuleDefinitionController } from "~tracer-api/domain/rule/inbound/rule.definition.controller.js";
import { RuleQueryController } from "~tracer-api/domain/rule/inbound/rule.query.controller.js";

export const ruleFeature = {
    controllers: [RuleQueryController, RuleDefinitionController],
    providers: [
        CreateRuleUseCase,
        DeleteRuleUseCase,
        UpdateRuleUseCase,
        GetRuleEvidenceUseCase,
        ListRulesUseCase,
        { provide: RULE_REPOSITORY, useExisting: RuleRepository },
        { provide: RULE_TURN_REPOSITORY, useExisting: TurnRepository },
        { provide: RULE_VERDICT_REPOSITORY, useExisting: VerdictRepository },
        { provide: RULE_EVENT_READER, useExisting: EventRepository },
        { provide: CLOCK, useClass: SystemClock },
        { provide: RULE_ID_GENERATOR, useClass: RuleUlidGenerator },
    ],
};
