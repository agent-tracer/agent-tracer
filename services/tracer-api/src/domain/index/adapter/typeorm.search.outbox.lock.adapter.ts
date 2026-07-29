import { Inject, Injectable } from "@nestjs/common";
import type { DataSource, EntityManager } from "typeorm";
import {
    MemoEntity,
    MemoRepository,
    RecipeEntity,
    RecipeRepository,
    SearchOutboxEntity,
    SearchOutboxRepository,
    TaskUserStateEntity,
    TaskUserStateRepository,
} from "@agent-tracer/tracer-model";
import { TRACER_DATA_SOURCE } from "~tracer-api/config/tracer.datasource.token.js";
import type { AdvisoryLockPort } from "~tracer-api/domain/index/port/advisory.lock.port.js";
import type { SearchOutboxDrainRepositories } from "~tracer-api/domain/index/port/search.outbox.drain.repository.port.js";

/** Postgres 어드바이저리 락으로 검색 아웃박스 배출의 동시 실행을 하나로 좁히는 어댑터다. */
@Injectable()
export class TypeOrmSearchOutboxLockAdapter implements AdvisoryLockPort<SearchOutboxDrainRepositories> {
    constructor(@Inject(TRACER_DATA_SOURCE) private readonly dataSource: DataSource) {}

    withAdvisoryLock<T>(
        lockKey: number,
        work: (repositories: SearchOutboxDrainRepositories) => Promise<T>,
    ): Promise<T | null> {
        return this.dataSource.transaction(async (manager) => {
            const rows = await manager.query<{ locked: boolean }[]>(
                "SELECT pg_try_advisory_xact_lock($1) AS locked",
                [lockKey],
            );
            if (rows[0]?.locked !== true) return null;
            return work(this.build(manager));
        });
    }

    private build(manager: EntityManager): SearchOutboxDrainRepositories {
        return {
            searchOutbox: new SearchOutboxRepository(manager.getRepository(SearchOutboxEntity)),
            recipes: new RecipeRepository(manager.getRepository(RecipeEntity)),
            taskUserStates: new TaskUserStateRepository(manager.getRepository(TaskUserStateEntity)),
            memos: new MemoRepository(manager.getRepository(MemoEntity)),
        };
    }
}
