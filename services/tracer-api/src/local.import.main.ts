import "reflect-metadata";
import type { DataSource } from "typeorm";
import fs from "node:fs";
import path from "node:path";
import { createDataSource, loadApplicationConfig, SQLITE_PROFILE } from "@agent-tracer/platform";
import { MONITOR_USER_HEADER } from "@agent-tracer/kernel";
import {
    MemoEntity,
    RecipeEntity,
    SEARCH_OUTBOX_TARGET,
    SearchOutboxEntity,
    TaskUserStateEntity,
    TaskEntity,
    TRACER_ENTITIES,
    type SearchOutboxTarget,
} from "@agent-tracer/tracer-model";
import { errorMessage, logError, logInfo } from "~tracer-api/support/log.js";
import {
    SPLIT_TASK_TABLE,
    USER_OWNED_ENTITIES,
    type LocalStateBundle,
    type ReplayEvent,
} from "~tracer-api/support/local.migration.tables.js";

const REPLAY_BATCH_SIZE = 100;
const DATE_TYPES = new Set(["timestamptz", "datetime", "timestamp with time zone"]);

function inputDir(): string {
    return process.env["LOCAL_EXPORT_DIR"] ?? path.join(process.cwd(), "local-export");
}

function ingestBaseUrl(): string {
    return process.env["INGEST_BASE_URL"] ?? "http://127.0.0.1:3901";
}

function replayUserId(): string {
    return process.env["REPLAY_USER_ID"] ?? "default";
}

function contractVersion(): string {
    return process.env["REPLAY_CONTRACT_VERSION"] ?? "9.9.9";
}

/** JSON을 거치며 문자열이 된 시각을 컬럼 선언에 맞춰 Date로 되돌린다. */
function reviveDates(rows: Record<string, unknown>[], dateProps: readonly string[]): void {
    for (const row of rows) {
        for (const prop of dateProps) {
            const value = row[prop];
            if (typeof value === "string") row[prop] = new Date(value);
        }
    }
}

async function importState(dir: string): Promise<Record<string, number>> {
    const config = loadApplicationConfig();
    const tracer = createDataSource({ db: config.tracerDb, entities: TRACER_ENTITIES, migrations: [] });
    await tracer.initialize();
    try {
        const bundle = JSON.parse(
            fs.readFileSync(path.join(dir, "state.json"), "utf8"),
        ) as LocalStateBundle;
        const counts: Record<string, number> = {};
        for (const entity of USER_OWNED_ENTITIES) {
            const meta = tracer.getMetadata(entity);
            const rows = bundle.tables[meta.tableName] ?? [];
            counts[meta.tableName] = rows.length;
            if (rows.length === 0) continue;
            reviveDates(
                rows,
                meta.columns.filter((column) => DATE_TYPES.has(String(column.type)))
                    .map((column) => column.propertyName),
            );
            const conflictPaths = meta.primaryColumns.map((column) => column.propertyName);
            await tracer.getRepository(entity).upsert(rows, conflictPaths);
        }
        await importSplitTasks(tracer, bundle, counts);
        return counts;
    } finally {
        await tracer.destroy();
    }
}

/** 분리가 만든 태스크는 원장 재생이 못 되살리므로 꾸러미에서 그대로 되돌린다. */
async function importSplitTasks(
    tracer: DataSource,
    bundle: LocalStateBundle,
    counts: Record<string, number>,
): Promise<void> {
    const rows = bundle.tables[SPLIT_TASK_TABLE] ?? [];
    counts[SPLIT_TASK_TABLE] = rows.length;
    if (rows.length === 0) return;
    const meta = tracer.getMetadata(TaskEntity);
    reviveDates(
        rows,
        meta.columns.filter((column) => DATE_TYPES.has(String(column.type)))
            .map((column) => column.propertyName),
    );
    await tracer.getRepository(TaskEntity).upsert(
        rows,
        meta.primaryColumns.map((column) => column.propertyName),
    );
}

/** 검색 대상 엔티티와 아웃박스가 쓰는 대상 이름의 짝이다. */
const INDEXED_ENTITIES = [
    { entity: RecipeEntity, target: SEARCH_OUTBOX_TARGET.recipe, idProperty: "id" },
    { entity: MemoEntity, target: SEARCH_OUTBOX_TARGET.memo, idProperty: "id" },
    // task 아웃박스가 가리키는 것은 복합 키의 사용자 쪽이 아니라 태스크다.
    { entity: TaskUserStateEntity, target: SEARCH_OUTBOX_TARGET.task, idProperty: "taskId" },
] as const;

interface OutboxSubject {
    readonly userId: string;
    readonly targetId: string;
    readonly target: SearchOutboxTarget;
}

/** 직접 upsert는 유스케이스를 거치지 않아 아웃박스가 비므로 색인 요청을 여기서 대신 넣는다. */
async function enqueueSearchIndexing(now: Date): Promise<number> {
    const config = loadApplicationConfig();
    const tracer = createDataSource({ db: config.tracerDb, entities: TRACER_ENTITIES, migrations: [] });
    await tracer.initialize();
    try {
        return await collectAndEnqueue(tracer, now);
    } finally {
        await tracer.destroy();
    }
}

async function collectAndEnqueue(
    tracer: Awaited<ReturnType<typeof createDataSource>>,
    now: Date,
): Promise<number> {
    const subjects: OutboxSubject[] = [];
    for (const { entity, target, idProperty } of INDEXED_ENTITIES) {
        const rows = await tracer.getRepository(entity).find() as unknown as Record<string, unknown>[];
        for (const row of rows) {
            const targetId = row[idProperty];
            const userId = row["userId"];
            if (typeof targetId !== "string" || typeof userId !== "string") continue;
            subjects.push({ userId, targetId, target });
        }
    }
    if (subjects.length === 0) return 0;
    // 아웃박스 식별자를 대상에서 결정적으로 짓는 덕에 이관을 다시 돌려도 요청이 겹치지 않는다.
    const rows = subjects.map((subject) => SearchOutboxEntity.enqueue({
        id: `import:${subject.target}:${subject.targetId}`,
        userId: subject.userId,
        target: subject.target,
        targetId: subject.targetId,
        now,
    }));
    await tracer.getRepository(SearchOutboxEntity).upsert(rows, ["id"]);
    return rows.length;
}

function readLedger(dir: string): ReplayEvent[] {
    const file = path.join(dir, "ledger.jsonl");
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as ReplayEvent);
}

async function postBatch(events: readonly ReplayEvent[]): Promise<void> {
    const response = await fetch(`${ingestBaseUrl()}/ingest/v1/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", [MONITOR_USER_HEADER]: replayUserId() },
        body: JSON.stringify({ contractVersion: contractVersion(), events }),
    });
    if (!response.ok) {
        throw new Error(`ingest replay rejected batch: ${response.status} ${await response.text()}`);
    }
    const body = await response.json() as { rejected?: { id: string; reason: string }[] };
    for (const entry of body.rejected ?? []) {
        logError({ msg: "local.import.event_rejected", eventId: entry.id, reason: entry.reason });
    }
}

/** 원장 재생은 이벤트 ID 멱등성에 기대므로 중간에 끊겨도 처음부터 다시 돌릴 수 있다. */
async function replayLedger(dir: string): Promise<number> {
    const events = readLedger(dir);
    for (let offset = 0; offset < events.length; offset += REPLAY_BATCH_SIZE) {
        await postBatch(events.slice(offset, offset + REPLAY_BATCH_SIZE));
    }
    return events.length;
}

async function main(): Promise<void> {
    const config = loadApplicationConfig();
    if (config.profile === SQLITE_PROFILE) {
        throw new Error("import writes the restored infrastructure and must not run on the sqlite profile");
    }
    const dir = inputDir();

    // 규칙이 먼저 서 있어야 재생이 만드는 턴에 판정이 붙는다.
    const stateCounts = await importState(dir);
    const replayed = await replayLedger(dir);
    // 색인 요청은 재생이 만든 문서를 투영이 덮어쓴 뒤에 얹혀야 사용자 상태가 살아남는다.
    const indexRequests = await enqueueSearchIndexing(new Date());
    logInfo({ msg: "local.import.completed", dir, stateCounts, indexRequests, replayed });
}

await main().catch((error: unknown) => {
    logError({ msg: "local.import.failed", error: errorMessage(error) });
    process.exit(1);
});
