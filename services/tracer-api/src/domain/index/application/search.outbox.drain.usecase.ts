import { Inject, Injectable } from "@nestjs/common";
import type { MemoEntity, SearchOutboxEntity } from "@agent-tracer/tracer-model";
import { ADVISORY_LOCK_KEY } from "~tracer-api/domain/index/port/advisory.lock.keys.js";
import {
    ADVISORY_LOCK,
    type AdvisoryLockPort,
} from "~tracer-api/domain/index/port/advisory.lock.port.js";
import type {
    SearchOutboxDrainRepositories,
    SearchOutboxMemoRepository,
    SearchOutboxRecipeRepository,
} from "~tracer-api/domain/index/port/search.outbox.drain.repository.port.js";
import { taskDocumentId } from "~tracer-api/domain/index/model/search.document.id.js";
import { buildTaskDocument } from "~tracer-api/support/task.document.js";
import { buildRecipeDocument } from "~tracer-api/support/recipe.document.js";
import { MEMOS_ALIAS } from "~tracer-api/domain/index/model/search.index.definitions.js";
import {
    SEARCH_INDEX_WRITER,
    type SearchIndexWriterPort,
} from "~tracer-api/domain/index/port/search.index.writer.port.js";
import { errorMessage, logError, logInfo } from "~tracer-api/support/log.js";

const RECIPES_ALIAS = "recipes";
const TASKS_ALIAS = "tasks";
const DRAIN_BATCH_SIZE = 100;

function memoDocument(memo: MemoEntity): Record<string, unknown> {
    return {
        userId: memo.userId,
        taskId: memo.taskId,
        eventId: memo.eventId,
        author: memo.author,
        body: memo.body,
        updatedAt: memo.updatedAt.toISOString(),
    };
}

/** 도메인 커밋과 같은 트랜잭션에 적재된 검색 반영 요청을 주기적으로 배출한다. */
@Injectable()
export class SearchOutboxDrainUseCase {
    constructor(
        @Inject(ADVISORY_LOCK) private readonly lock: AdvisoryLockPort<SearchOutboxDrainRepositories>,
        @Inject(SEARCH_INDEX_WRITER) private readonly searchIndex: SearchIndexWriterPort,
    ) {}

    async runOnce(): Promise<number> {
        const drained = await this.lock.withAdvisoryLock(ADVISORY_LOCK_KEY.searchOutboxDrain, async (repos) => {
            const rows = await repos.searchOutbox.findBatch(DRAIN_BATCH_SIZE);
            let applied = 0;
            for (const row of rows) {
                if (await this.apply(row, repos)) {
                    await repos.searchOutbox.delete(row.id);
                    applied += 1;
                    continue;
                }
                await repos.searchOutbox.markFailed(row.id, row.attempts + 1, "search index write failed");
            }
            return applied;
        });
        if (drained === null) {
            logInfo({ msg: "search.outbox_drain.skipped", reason: "lock_not_acquired" });
            return 0;
        }
        if (drained > 0) logInfo({ msg: "search.outbox_drain.completed", count: drained });
        return drained;
    }

    private async apply(row: SearchOutboxEntity, repos: SearchOutboxDrainRepositories): Promise<boolean> {
        if (row.isRecipe()) return this.applyRecipe(row, repos.recipes);
        if (row.isMemo()) return this.applyMemo(row, repos.memos);
        return this.applyTask(row, repos);
    }

    // 소프트삭제된(또는 삭제된) 레시피는 조회에 잡히지 않으므로 못 찾은 것과 지워야 할 것을 구분하지 않는다.
    private async applyRecipe(row: SearchOutboxEntity, recipes: SearchOutboxRecipeRepository): Promise<boolean> {
        try {
            const recipe = await recipes.findById(row.targetId);
            if (recipe === null) {
                await this.searchIndex.deleteDocument(RECIPES_ALIAS, row.targetId);
                return true;
            }
            await this.searchIndex.indexDocument(RECIPES_ALIAS, recipe.id, buildRecipeDocument(recipe));
            return true;
        } catch (error) {
            this.logFailure(row, error);
            return false;
        }
    }

    private async applyMemo(row: SearchOutboxEntity, memos: SearchOutboxMemoRepository): Promise<boolean> {
        try {
            const memo = await memos.findById(row.targetId);
            if (memo === null || memo.isDeleted()) {
                await this.searchIndex.deleteDocument(MEMOS_ALIAS, row.targetId);
                return true;
            }
            await this.searchIndex.indexDocument(MEMOS_ALIAS, memo.id, memoDocument(memo));
            return true;
        } catch (error) {
            this.logFailure(row, error);
            return false;
        }
    }

    // 분리로 태어난 태스크는 원장에 없어 색인 문서도 없으므로 읽기 모델에서 전체 문서를 만들어 덮는다.
    private async applyTask(row: SearchOutboxEntity, repos: SearchOutboxDrainRepositories): Promise<boolean> {
        try {
            const archived = (await repos.taskUserStates.findById(row.userId, row.targetId))?.isArchived() ?? false;
            const documentId = taskDocumentId(row.userId, row.targetId);
            const task = await repos.tasks.findById(row.userId, row.targetId);
            if (task === null) {
                await this.searchIndex.updateDocument(TASKS_ALIAS, documentId, { archived });
                return true;
            }
            await this.searchIndex.indexDocument(TASKS_ALIAS, documentId, buildTaskDocument(task, archived));
            return true;
        } catch (error) {
            this.logFailure(row, error);
            return false;
        }
    }

    private logFailure(row: SearchOutboxEntity, error: unknown): void {
        logError({
            msg: "search.outbox_drain.failed",
            target: row.target,
            targetId: row.targetId,
            attempts: row.attempts,
            error: errorMessage(error),
        });
    }
}
