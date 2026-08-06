import { createDataSource, createOpenSearchClient, loadApplicationConfig } from "@agent-tracer/platform";
import { TRACER_ENTITIES } from "@agent-tracer/tracer-model";
import { SearchReindexUseCase } from "~tracer-api/domain/index/application/search.reindex.usecase.js";
import { RestoreSplitTaskDocsUseCase } from "~tracer-api/domain/index/application/restore.split.task.docs.usecase.js";
import { OpenSearchIndexAdapter } from "~tracer-api/domain/index/adapter/open.search.index.adapter.js";
import { TypeOrmSplitTaskReaderAdapter } from "~tracer-api/domain/index/adapter/typeorm.split.task.reader.adapter.js";
import { TASKS_ALIAS } from "~tracer-api/domain/index/model/search.index.definitions.js";

const alias = process.argv[2];
if (alias === undefined) {
    process.stderr.write("사용법: npm run search:reindex -- <alias>  (예: events, tasks, recipes)\n");
    process.exit(1);
}

const client = createOpenSearchClient();
const usecase = new SearchReindexUseCase(new OpenSearchIndexAdapter(client));
const result = await usecase.execute(alias);

if (!result.migrated) {
    process.stdout.write(`[search-reindex] ${result.alias}는 이미 ${result.toIndex}를 가리킨다. 할 일이 없다\n`);
} else {
    process.stdout.write(
        `[search-reindex] ${result.alias}: ${result.fromIndex}(${result.sourceCount}건) -> ${result.toIndex}(${result.targetCount}건)로 alias를 스왑했다\n`,
    );
}

// tasks 색인은 원장에서 다시 채우는데 턴 분리로 태어난 태스크는 원장에 없어 그대로 두면 검색에서 사라진다.
if (result.migrated && alias === TASKS_ALIAS) {
    const dataSource = createDataSource({
        db: loadApplicationConfig().tracerDb,
        entities: [...TRACER_ENTITIES],
        migrations: [],
    });
    await dataSource.initialize();
    try {
        const restored = await new RestoreSplitTaskDocsUseCase(
            new TypeOrmSplitTaskReaderAdapter(dataSource),
            new OpenSearchIndexAdapter(client),
        ).execute();
        process.stdout.write(`[search-reindex] 분리 태스크 ${restored}건을 색인에 되살렸다\n`);
    } finally {
        await dataSource.destroy();
    }
}
