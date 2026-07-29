import { Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import type { ReadinessProbe } from "~ingest-api/domain/health/port/readiness.probe.port.js";
import { EVENT_DATA_SOURCE } from "~ingest-api/config/event.datasource.token.js";

/** 준비성 점검을 원장 DataSource의 왕복 질의로 수행한다. */
@Injectable()
export class DataSourceReadinessProbeAdapter implements ReadinessProbe {
    constructor(@Inject(EVENT_DATA_SOURCE) private readonly dataSource: DataSource) {}

    async ping(): Promise<void> {
        await this.dataSource.query("SELECT 1");
    }
}
