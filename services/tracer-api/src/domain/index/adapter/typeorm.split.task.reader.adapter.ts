import { Inject, Injectable } from "@nestjs/common";
import { Not, IsNull, type DataSource } from "typeorm";
import { TaskEntity, TaskUserStateEntity } from "@agent-tracer/tracer-model";
import { TRACER_DATA_SOURCE } from "~tracer-api/config/tracer.datasource.token.js";
import type { SplitTaskReaderPort } from "~tracer-api/domain/index/port/split.task.reader.port.js";

/** 턴 분리로 태어난 태스크를 읽기 모델에서 직접 읽는 어댑터다. */
@Injectable()
export class TypeOrmSplitTaskReaderAdapter implements SplitTaskReaderPort {
    constructor(@Inject(TRACER_DATA_SOURCE) private readonly dataSource: DataSource) {}

    async findSplitTasks(): Promise<readonly TaskEntity[]> {
        return this.dataSource.getRepository(TaskEntity).find({ where: { splitFromTaskId: Not(IsNull()) } });
    }

    async findArchivedTaskIds(): Promise<ReadonlySet<string>> {
        const rows = await this.dataSource
            .getRepository(TaskUserStateEntity)
            .find({ where: { archivedAt: Not(IsNull()) }, select: { taskId: true } });
        return new Set(rows.map((row) => row.taskId));
    }
}
