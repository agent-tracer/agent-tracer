import type { Provider } from "@nestjs/common";
import type { DataSource } from "typeorm";
import {
    EventEntity,
    EventRepository,
    RuleEntity,
    RuleRepository,
    SessionEntity,
    SessionRepository,
    TaskEntity,
    TaskRepository,
    TaskUserStateEntity,
    TaskUserStateRepository,
    TurnEntity,
    TurnRepository,
    VerdictEntity,
    VerdictRepository,
} from "@agent-tracer/tracer-model";
import { TRACER_DATA_SOURCE } from "~tracer-api/config/tracer.datasource.token.js";

/** 읽기 모델 저장소를 TRACER_DATA_SOURCE에 연결해 앱 전역에 공급한다. */
export const repositoryProviders: Provider[] = [
    { provide: TaskRepository, inject: [TRACER_DATA_SOURCE], useFactory: (ds: DataSource) => new TaskRepository(ds.getRepository(TaskEntity)) },
    { provide: TaskUserStateRepository, inject: [TRACER_DATA_SOURCE], useFactory: (ds: DataSource) => new TaskUserStateRepository(ds.getRepository(TaskUserStateEntity)) },
    { provide: SessionRepository, inject: [TRACER_DATA_SOURCE], useFactory: (ds: DataSource) => new SessionRepository(ds.getRepository(SessionEntity)) },
    { provide: EventRepository, inject: [TRACER_DATA_SOURCE], useFactory: (ds: DataSource) => new EventRepository(ds.getRepository(EventEntity)) },
    { provide: TurnRepository, inject: [TRACER_DATA_SOURCE], useFactory: (ds: DataSource) => new TurnRepository(ds.getRepository(TurnEntity)) },
    { provide: RuleRepository, inject: [TRACER_DATA_SOURCE], useFactory: (ds: DataSource) => new RuleRepository(ds.getRepository(RuleEntity)) },
    { provide: VerdictRepository, inject: [TRACER_DATA_SOURCE], useFactory: (ds: DataSource) => new VerdictRepository(ds.getRepository(VerdictEntity)) },
];
