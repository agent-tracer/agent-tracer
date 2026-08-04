import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { TokenBucketLimiter, type createDataSource } from "@agent-tracer/platform";
import { IngestController } from "~ingest-api/domain/ingest/inbound/ingest.controller.js";
import { ContractVersionPipe } from "~ingest-api/domain/ingest/inbound/contract.version.pipe.js";
import { IngestBatchValidationPipe } from "~ingest-api/domain/ingest/inbound/ingest.batch.validation.pipe.js";
import {
    INGEST_RATE_LIMIT_CONFIG,
    IngestRateLimitGuard,
    resolveIngestRateLimitConfig,
    resolveIngestRateLimiter,
} from "~ingest-api/domain/ingest/inbound/ingest.rate-limit.guard.js";
import { AppendEventsUseCase } from "~ingest-api/domain/ingest/application/append.events.usecase.js";
import { IngestGateLogService } from "~ingest-api/domain/ingest/application/ingest.gate.log.service.js";
import { INGEST_EVENT_LOG } from "~ingest-api/domain/ingest/port/ingest.event.log.port.js";
import { LEDGER_EVENT_STORE } from "~ingest-api/domain/ingest/port/ledger.event.store.port.js";
import { StructuredIngestEventLogAdapter } from "~ingest-api/domain/ingest/adapter/structured.ingest.event.log.adapter.js";
import { TypeOrmLedgerEventStoreAdapter } from "~ingest-api/domain/ingest/adapter/typeorm.ledger.event.store.adapter.js";
import { SqliteLedgerEventStoreAdapter } from "~ingest-api/domain/ingest/adapter/sqlite.ledger.event.store.adapter.js";
import { HealthController } from "~ingest-api/domain/health/inbound/health.controller.js";
import { CheckReadinessUseCase } from "~ingest-api/domain/health/application/check.readiness.usecase.js";
import { READINESS_PROBE } from "~ingest-api/domain/health/port/readiness.probe.port.js";
import { DataSourceReadinessProbeAdapter } from "~ingest-api/domain/health/adapter/datasource.readiness.probe.adapter.js";
import { AuthGuard } from "~ingest-api/config/auth.guard.js";
import { EVENT_DATA_SOURCE } from "~ingest-api/config/event.datasource.token.js";
import { AccessLogInterceptor } from "~ingest-api/config/access.log.interceptor.js";

type LedgerDataSource = ReturnType<typeof createDataSource>;

@Module({})
export class IngestApiModule {
    static forRoot(dataSource: LedgerDataSource): DynamicModule {
        // 원장 저장 방식은 연결이 말하는 방언을 따르므로 조립 근원이 따로 받지 않는다.
        const ledgerStore = dataSource.options.type === "better-sqlite3"
            ? SqliteLedgerEventStoreAdapter
            : TypeOrmLedgerEventStoreAdapter;
        return {
            module: IngestApiModule,
            controllers: [IngestController, HealthController],
            providers: [
                { provide: EVENT_DATA_SOURCE, useValue: dataSource },
                ledgerStore,
                { provide: LEDGER_EVENT_STORE, useExisting: ledgerStore },
                DataSourceReadinessProbeAdapter,
                { provide: READINESS_PROBE, useExisting: DataSourceReadinessProbeAdapter },
                StructuredIngestEventLogAdapter,
                { provide: INGEST_EVENT_LOG, useExisting: StructuredIngestEventLogAdapter },
                IngestGateLogService,
                ContractVersionPipe,
                IngestBatchValidationPipe,
                AppendEventsUseCase,
                CheckReadinessUseCase,
                { provide: TokenBucketLimiter, useFactory: resolveIngestRateLimiter },
                { provide: INGEST_RATE_LIMIT_CONFIG, useFactory: resolveIngestRateLimitConfig },
                // 인증이 먼저 신원을 확정해야 레이트리밋이 진짜 사용자 단위로 걸린다.
                { provide: APP_GUARD, useClass: AuthGuard },
                { provide: APP_GUARD, useClass: IngestRateLimitGuard },
                { provide: APP_INTERCEPTOR, useClass: AccessLogInterceptor },
            ],
        };
    }
}
