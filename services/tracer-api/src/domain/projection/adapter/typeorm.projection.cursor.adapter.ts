import { Injectable } from "@nestjs/common";
import type { DataSource } from "typeorm";
import type { ProjectionCursorStore } from "~tracer-api/support/ledger.source.js";
import { LocalProjectionCursorEntity } from "./local.projection.cursor.entity.js";

/** 투영 커서를 조회 모델과 같은 데이터베이스에 남긴다. */
@Injectable()
export class TypeOrmProjectionCursorAdapter implements ProjectionCursorStore {
    constructor(private readonly dataSource: DataSource) {}

    async read(name: string): Promise<number> {
        const row = await this.dataSource
            .getRepository(LocalProjectionCursorEntity)
            .findOneBy({ name });
        return row?.appliedSeq ?? 0;
    }

    async write(name: string, seq: number): Promise<void> {
        await this.dataSource
            .getRepository(LocalProjectionCursorEntity)
            .upsert({ name, appliedSeq: seq }, ["name"]);
    }
}
