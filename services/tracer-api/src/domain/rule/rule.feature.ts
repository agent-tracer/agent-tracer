import { SystemClock } from "@agent-tracer/platform";
import {
    EventRepository,
    RuleGenerationRepository,
    RuleRepository,
    TurnRepository,
    VerdictRepository,
} from "@agent-tracer/tracer-model";
import { RuleUlidGenerator } from "~tracer-api/domain/rule/adapter/rule.ulid.generator.js";
import { ApproveRuleUseCase } from "~tracer-api/domain/rule/application/command/approve.rule.usecase.js";
import { CancelRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/cancel.rule.generation.usecase.js";
import { CreateRuleUseCase } from "~tracer-api/domain/rule/application/command/create.rule.usecase.js";
import { LeaseRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/lease.rule.generation.usecase.js";
import { RequestRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/request.rule.generation.usecase.js";
import { SettleRuleGenerationUseCase } from "~tracer-api/domain/rule/application/command/settle.rule.generation.usecase.js";
import { DeleteRuleUseCase } from "~tracer-api/domain/rule/application/command/delete.rule.usecase.js";
import { RecordNudgeUseCase } from "~tracer-api/domain/rule/application/command/record.nudge.usecase.js";
import { ReevaluateRuleUseCase } from "~tracer-api/domain/rule/application/command/reevaluate.rule.usecase.js";
import { UpdateRuleUseCase } from "~tracer-api/domain/rule/application/command/update.rule.usecase.js";
import { GetRuleEvidenceUseCase } from "~tracer-api/domain/rule/application/query/get.rule.evidence.usecase.js";
import { ListRuleGenerationsUseCase } from "~tracer-api/domain/rule/application/query/list.rule.generations.usecase.js";
import { ListRulesUseCase } from "~tracer-api/domain/rule/application/query/list.rules.usecase.js";
import { RuleBackfillService } from "~tracer-api/domain/rule/application/rule.backfill.service.js";
import { RuleCreationService } from "~tracer-api/domain/rule/application/rule.creation.service.js";
import { CLOCK } from "~tracer-api/domain/rule/port/clock.port.js";
import { RULE_EVENT_READER } from "~tracer-api/domain/rule/port/event.reader.port.js";
import { RULE_ID_GENERATOR } from "~tracer-api/domain/rule/port/rule.id.generator.port.js";
import { RULE_GENERATION_REPOSITORY } from "~tracer-api/domain/rule/port/rule.generation.repository.port.js";
import { RULE_REPOSITORY } from "~tracer-api/domain/rule/port/rule.repository.port.js";
import { RULE_TURN_REPOSITORY } from "~tracer-api/domain/rule/port/turn.repository.port.js";
import { RULE_VERDICT_REPOSITORY } from "~tracer-api/domain/rule/port/verdict.repository.port.js";
import { RuleDefinitionController } from "~tracer-api/domain/rule/inbound/rule.definition.controller.js";
import { RuleGenerationController } from "~tracer-api/domain/rule/inbound/rule.generation.controller.js";
import { RuleLifecycleController } from "~tracer-api/domain/rule/inbound/rule.lifecycle.controller.js";
import { RuleQueryController } from "~tracer-api/domain/rule/inbound/rule.query.controller.js";

export const ruleFeature = {
    controllers: [RuleGenerationController, RuleQueryController, RuleDefinitionController, RuleLifecycleController],
    providers: [
        ApproveRuleUseCase,
        CreateRuleUseCase,
        DeleteRuleUseCase,
        ReevaluateRuleUseCase,
        RecordNudgeUseCase,
        UpdateRuleUseCase,
        GetRuleEvidenceUseCase,
        ListRulesUseCase,
        RequestRuleGenerationUseCase,
        LeaseRuleGenerationUseCase,
        SettleRuleGenerationUseCase,
        CancelRuleGenerationUseCase,
        ListRuleGenerationsUseCase,
        RuleBackfillService,
        RuleCreationService,
        { provide: RULE_REPOSITORY, useExisting: RuleRepository },
        { provide: RULE_GENERATION_REPOSITORY, useExisting: RuleGenerationRepository },
        { provide: RULE_TURN_REPOSITORY, useExisting: TurnRepository },
        { provide: RULE_VERDICT_REPOSITORY, useExisting: VerdictRepository },
        { provide: RULE_EVENT_READER, useExisting: EventRepository },
        { provide: CLOCK, useClass: SystemClock },
        { provide: RULE_ID_GENERATOR, useClass: RuleUlidGenerator },
    ],
};
