import { SystemClock } from "@agent-tracer/platform";
import {
    EventRepository,
    SessionRepository,
    TaskRepository,
    TaskUserStateRepository,
    TurnReassignmentRepository,
    TurnRepository,
    VerdictRepository,
} from "@agent-tracer/tracer-model";
import { ArchiveTaskUseCase } from "~tracer-api/domain/task/application/command/archive.task.usecase.js";
import { HideTaskUseCase } from "~tracer-api/domain/task/application/command/hide.task.usecase.js";
import { RenameTaskUseCase } from "~tracer-api/domain/task/application/command/rename.task.usecase.js";
import { SetTaskStatusUseCase } from "~tracer-api/domain/task/application/command/set.task.status.usecase.js";
import { RevertTaskSplitUseCase } from "~tracer-api/domain/task/application/command/revert.task.split.usecase.js";
import { SplitTaskTurnsUseCase } from "~tracer-api/domain/task/application/command/split.task.turns.usecase.js";
import { UnarchiveTaskUseCase } from "~tracer-api/domain/task/application/command/unarchive.task.usecase.js";
import { ExportOpenInferenceUseCase } from "~tracer-api/domain/task/application/export/export.openinference.usecase.js";
import { GetTaskUseCase } from "~tracer-api/domain/task/application/query/get.task.usecase.js";
import { ListBoundariesUseCase } from "~tracer-api/domain/task/application/query/list.boundaries.usecase.js";
import { ListChildTasksUseCase } from "~tracer-api/domain/task/application/query/list.child.tasks.usecase.js";
import { ListTaskUserInputsUseCase } from "~tracer-api/domain/task/application/query/list.task.user.inputs.usecase.js";
import { ListTasksUseCase } from "~tracer-api/domain/task/application/query/list.tasks.usecase.js";
import { ListTurnsUseCase } from "~tracer-api/domain/task/application/query/list.turns.usecase.js";
import { TaskSplitService } from "~tracer-api/domain/task/application/task.split.service.js";
import { TaskUserStateService } from "~tracer-api/domain/task/application/task.user.state.service.js";
import { OpenSearchTaskIndex } from "~tracer-api/domain/task/adapter/opensearch.task.index.js";
import { TaskUlidGenerator } from "~tracer-api/domain/task/adapter/task.ulid.generator.js";
import { TypeOrmSplitWriterAdapter } from "~tracer-api/domain/task/adapter/typeorm.split.writer.adapter.js";
import { TypeOrmVerdictRealignerAdapter } from "~tracer-api/domain/task/adapter/typeorm.verdict.realigner.adapter.js";
import { VERDICT_REALIGNER } from "~tracer-api/domain/task/port/verdict.realigner.port.js";
import { SPLIT_WRITER } from "~tracer-api/domain/task/port/split.write.port.js";
import { TASK_ID_GENERATOR } from "~tracer-api/domain/task/port/task.id.generator.port.js";
import { TURN_REASSIGNMENT_REPOSITORY } from "~tracer-api/domain/task/port/turn.reassignment.repository.port.js";
import { CLOCK } from "~tracer-api/domain/task/port/clock.port.js";
import { EVENT_READER } from "~tracer-api/domain/task/port/event.reader.port.js";
import { SESSION_READER } from "~tracer-api/domain/task/port/session.reader.port.js";
import { TASK_REPOSITORY } from "~tracer-api/domain/task/port/task.repository.port.js";
import { TASK_SEARCH_INDEX } from "~tracer-api/domain/task/port/task.search.index.port.js";
import { TASK_USER_STATE_REPOSITORY } from "~tracer-api/domain/task/port/task.user.state.repository.port.js";
import { TURN_READER } from "~tracer-api/domain/task/port/turn.reader.port.js";
import { VERDICT_READER } from "~tracer-api/domain/task/port/verdict.reader.port.js";
import { TaskActivityController } from "~tracer-api/domain/task/inbound/task.activity.controller.js";
import { TaskCommandController } from "~tracer-api/domain/task/inbound/task.command.controller.js";
import { TaskExportController } from "~tracer-api/domain/task/inbound/task.export.controller.js";
import { TaskQueryController } from "~tracer-api/domain/task/inbound/task.query.controller.js";

export const taskFeature = {
    controllers: [TaskQueryController, TaskActivityController, TaskExportController, TaskCommandController],
    providers: [
        ArchiveTaskUseCase,
        HideTaskUseCase,
        RenameTaskUseCase,
        SetTaskStatusUseCase,
        UnarchiveTaskUseCase,
        SplitTaskTurnsUseCase,
        RevertTaskSplitUseCase,
        TaskSplitService,
        ExportOpenInferenceUseCase,
        GetTaskUseCase,
        ListBoundariesUseCase,
        ListChildTasksUseCase,
        ListTasksUseCase,
        ListTaskUserInputsUseCase,
        ListTurnsUseCase,
        TaskUserStateService,
        OpenSearchTaskIndex,
        TaskUlidGenerator,
        TypeOrmSplitWriterAdapter,
        TypeOrmVerdictRealignerAdapter,
        { provide: TASK_REPOSITORY, useExisting: TaskRepository },
        { provide: TASK_USER_STATE_REPOSITORY, useExisting: TaskUserStateRepository },
        { provide: SESSION_READER, useExisting: SessionRepository },
        { provide: EVENT_READER, useExisting: EventRepository },
        { provide: TURN_READER, useExisting: TurnRepository },
        { provide: TURN_REASSIGNMENT_REPOSITORY, useExisting: TurnReassignmentRepository },
        { provide: SPLIT_WRITER, useExisting: TypeOrmSplitWriterAdapter },
        { provide: TASK_ID_GENERATOR, useExisting: TaskUlidGenerator },
        { provide: VERDICT_REALIGNER, useExisting: TypeOrmVerdictRealignerAdapter },
        { provide: VERDICT_READER, useExisting: VerdictRepository },
        { provide: TASK_SEARCH_INDEX, useExisting: OpenSearchTaskIndex },
        { provide: CLOCK, useClass: SystemClock },
    ],
};
