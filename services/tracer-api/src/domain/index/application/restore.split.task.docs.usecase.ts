import { Inject, Injectable } from "@nestjs/common";
import { taskDocumentId } from "~tracer-api/domain/index/model/search.document.id.js";
import { TASKS_ALIAS } from "~tracer-api/domain/index/model/search.index.definitions.js";
import { buildTaskDocument } from "~tracer-api/support/task.document.js";
import {
    SPLIT_TASK_READER,
    type SplitTaskReaderPort,
} from "~tracer-api/domain/index/port/split.task.reader.port.js";
import {
    SEARCH_INDEX_WRITER,
    type SearchIndexWriterPort,
} from "~tracer-api/domain/index/port/search.index.writer.port.js";

/** 원장 레코드의 taskId로 등장하지 않아 재구축만으로는 사라지는 분리 태스크를 `tasks` 색인에 되살린다. */
@Injectable()
export class RestoreSplitTaskDocsUseCase {
    constructor(
        @Inject(SPLIT_TASK_READER) private readonly tasks: SplitTaskReaderPort,
        @Inject(SEARCH_INDEX_WRITER) private readonly searchIndex: SearchIndexWriterPort,
    ) {}

    async execute(): Promise<number> {
        const tasks = await this.tasks.findSplitTasks();
        if (tasks.length === 0) return 0;

        const archived = await this.tasks.findArchivedTaskIds();
        for (const task of tasks) {
            await this.searchIndex.indexDocument(
                TASKS_ALIAS,
                taskDocumentId(task.userId, task.id),
                buildTaskDocument(task, archived.has(task.id)),
            );
        }
        return tasks.length;
    }
}
