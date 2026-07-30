import { TaskCleanupSuggestionRepository, TransactionRunner } from "@agent-tracer/tracer-model";
import { SystemClock } from "@agent-tracer/platform";
import { CleanupUlidGenerator } from "~tracer-api/domain/cleanup/adapter/cleanup.ulid.generator.js";
import { CreateCleanupSuggestionsUseCase } from "~tracer-api/domain/cleanup/application/command/create.cleanup.suggestions.usecase.js";
import { AcceptCleanupSuggestionUseCase } from "~tracer-api/domain/cleanup/application/command/accept.cleanup.suggestion.usecase.js";
import { DismissCleanupSuggestionUseCase } from "~tracer-api/domain/cleanup/application/command/dismiss.cleanup.suggestion.usecase.js";
import { ListCleanupSuggestionsUseCase } from "~tracer-api/domain/cleanup/application/query/list.cleanup.suggestions.usecase.js";
import { CleanupController } from "~tracer-api/domain/cleanup/inbound/cleanup.controller.js";
import { CLOCK } from "~tracer-api/domain/cleanup/port/clock.port.js";
import { CLEANUP_SUGGESTION_REPOSITORY } from "~tracer-api/domain/cleanup/port/cleanup.suggestion.repository.port.js";
import { CLEANUP_ID_GENERATOR } from "~tracer-api/domain/cleanup/port/cleanup.id.generator.port.js";
import { CLEANUP_TRANSACTION } from "~tracer-api/domain/cleanup/port/cleanup.transaction.port.js";

/** cleanup 슬라이스가 조립 근원에 공급하는 컨트롤러와 프로바이더 목록이다. */
export const cleanupFeature = {
    controllers: [CleanupController],
    providers: [
        AcceptCleanupSuggestionUseCase,
        CreateCleanupSuggestionsUseCase,
        DismissCleanupSuggestionUseCase,
        ListCleanupSuggestionsUseCase,
        { provide: CLOCK, useClass: SystemClock },
        { provide: CLEANUP_ID_GENERATOR, useClass: CleanupUlidGenerator },
        { provide: CLEANUP_SUGGESTION_REPOSITORY, useExisting: TaskCleanupSuggestionRepository },
        { provide: CLEANUP_TRANSACTION, useExisting: TransactionRunner },
    ],
};
