import { describe, expect, it } from "vitest";
import { TaskEntity } from "@agent-tracer/tracer-model";
import { RestoreSplitTaskDocsUseCase } from "./restore.split.task.docs.usecase.js";
import type { SplitTaskReaderPort } from "~tracer-api/domain/index/port/split.task.reader.port.js";
import type { SearchIndexWriterPort } from "~tracer-api/domain/index/port/search.index.writer.port.js";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function originTask(): TaskEntity {
    const task = new TaskEntity();
    task.id = "A";
    task.userId = "u1";
    task.title = "원본";
    task.slug = "원본";
    task.workspacePath = "/w";
    task.status = "running";
    task.taskKind = "primary";
    task.origin = "user";
    task.cliSource = "claude-code";
    task.createdAt = NOW;
    task.updatedAt = NOW;
    task.lastEventAt = null;
    return task;
}

function reader(tasks: readonly TaskEntity[], archived: readonly string[] = []): SplitTaskReaderPort {
    return {
        findSplitTasks: async () => tasks,
        findArchivedTaskIds: async () => new Set(archived),
    };
}

function writer() {
    const indexed: { index: string; id: string; document: Record<string, unknown> }[] = [];
    const port = {
        ensureIndex: async () => undefined,
        writeBulk: async () => ({ errors: false, itemCount: 0 }),
        indexDocument: async (index: string, id: string, document: Record<string, unknown>) => {
            indexed.push({ index, id, document });
        },
        updateDocument: async () => undefined,
        deleteDocument: async () => undefined,
    } satisfies SearchIndexWriterPort;
    return { port, indexed };
}

describe("RestoreSplitTaskDocsUseCase", () => {
    it("분리 태스크가 없으면 아무것도 쓰지 않는다", async () => {
        const { port, indexed } = writer();
        const count = await new RestoreSplitTaskDocsUseCase(reader([]), port).execute();

        expect(count).toBe(0);
        expect(indexed).toEqual([]);
    });

    it("분리 태스크를 전체 문서로 되살린다", async () => {
        const split = TaskEntity.splitFrom("B", originTask(), "로그인 버그", NOW);
        const { port, indexed } = writer();

        const count = await new RestoreSplitTaskDocsUseCase(reader([split]), port).execute();

        expect(count).toBe(1);
        expect(indexed[0]?.id).toBe('["u1","B"]');
        expect(indexed[0]?.document).toMatchObject({ taskId: "B", title: "로그인 버그", archived: false });
    });

    it("보관된 분리 태스크는 archived로 색인한다", async () => {
        const split = TaskEntity.splitFrom("B", originTask(), "로그인 버그", NOW);
        const { port, indexed } = writer();

        await new RestoreSplitTaskDocsUseCase(reader([split], ["B"]), port).execute();

        expect(indexed[0]?.document).toMatchObject({ archived: true });
    });
});
