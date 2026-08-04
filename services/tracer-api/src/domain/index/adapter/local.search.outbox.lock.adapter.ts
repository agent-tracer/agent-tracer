import { Injectable } from "@nestjs/common";
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
import type { AdvisoryLockPort } from "~tracer-api/domain/index/port/advisory.lock.port.js";
import type { SearchOutboxDrainRepositories } from "~tracer-api/domain/index/port/search.outbox.drain.repository.port.js";

/** sqlite는 쓰기를 하나로 직렬화하므로 어드바이저리 락 없이 트랜잭션 경계만 준다. */
@Injectable()
export class LocalSearchOutboxLockAdapter implements AdvisoryLockPort<SearchOutboxDrainRepositories> {
    constructor(private readonly dataSource: DataSource) {}

    withAdvisoryLock<T>(
        _lockKey: number,
        work: (repositories: SearchOutboxDrainRepositories) => Promise<T>,
    ): Promise<T | null> {
        return this.dataSource.transaction(async (manager) => work(this.build(manager)));
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
