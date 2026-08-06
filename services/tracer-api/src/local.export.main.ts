import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import { createDataSource, loadApplicationConfig, SQLITE_PROFILE } from "@agent-tracer/platform";
import { IsNull, Not } from "typeorm";
import { TaskEntity, TRACER_ENTITIES } from "@agent-tracer/tracer-model";
import { errorMessage, logError, logInfo } from "~tracer-api/support/log.js";
import {
    SPLIT_TASK_TABLE,
    USER_OWNED_ENTITIES,
    type LocalStateBundle,
    type ReplayEvent,
} from "~tracer-api/support/local.migration.tables.js";

/** 원장 한 행을 인제스트 요청으로 되돌리는 데 필요한 컬럼만 고른 모양이다. */
interface LedgerRow {
    readonly id: string;
    readonly kind: string;
    readonly task_id: string;
    readonly session_id: string | null;
    readonly parent_id: string | null;
    readonly turn_id: string | null;
    readonly occurred_at: string;
    readonly payload: string;
}

const SELECT_LEDGER = `
    SELECT id, kind, task_id, session_id, parent_id, turn_id, occurred_at, payload
    FROM events
    ORDER BY seq
`;

function outputDir(): string {
    return process.env["LOCAL_EXPORT_DIR"] ?? path.join(process.cwd(), "local-export");
}

// 인제스트 봉투는 없는 필드를 아예 싣지 않으므로 null인 상관 식별자는 키째 뺀다.
function toReplayEvent(row: LedgerRow): ReplayEvent {
    return {
        id: row.id,
        kind: row.kind,
        taskId: row.task_id,
        ...(row.session_id === null ? {} : { sessionId: row.session_id }),
        ...(row.parent_id === null ? {} : { parentId: row.parent_id }),
        ...(row.turn_id === null ? {} : { turnId: row.turn_id }),
        occurredAt: new Date(row.occurred_at).toISOString(),
        payload: JSON.parse(row.payload) as Record<string, unknown>,
    };
}

async function exportLedger(dir: string): Promise<number> {
    const config = loadApplicationConfig();
    const ledger = createDataSource({ db: config.eventDb, entities: [], migrations: [] });
    await ledger.initialize();
    try {
        const rows = await ledger.query<LedgerRow[]>(SELECT_LEDGER);
        const lines = rows.map((row) => JSON.stringify(toReplayEvent(row)));
        fs.writeFileSync(path.join(dir, "ledger.jsonl"), lines.map((line) => `${line}\n`).join(""));
        return rows.length;
    } finally {
        await ledger.destroy();
    }
}

async function exportState(dir: string): Promise<Record<string, number>> {
    const config = loadApplicationConfig();
    const tracer = createDataSource({ db: config.tracerDb, entities: TRACER_ENTITIES, migrations: [] });
    await tracer.initialize();
    try {
        const bundle: LocalStateBundle = { tables: {} };
        const counts: Record<string, number> = {};
        for (const entity of USER_OWNED_ENTITIES) {
            const table = tracer.getMetadata(entity).tableName;
            const rows = await tracer.getRepository(entity).find() as unknown as Record<string, unknown>[];
            bundle.tables[table] = rows;
            counts[table] = rows.length;
        }
        const splitTasks = await tracer.getRepository(TaskEntity)
            .find({ where: { splitFromTaskId: Not(IsNull()) } }) as unknown as Record<string, unknown>[];
        bundle.tables[SPLIT_TASK_TABLE] = splitTasks;
        counts[SPLIT_TASK_TABLE] = splitTasks.length;

        fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify(bundle, null, 2));
        return counts;
    } finally {
        await tracer.destroy();
    }
}

async function main(): Promise<void> {
    const config = loadApplicationConfig();
    if (config.profile !== SQLITE_PROFILE) {
        throw new Error(`export reads the local ledger and requires MONITOR_PROFILE=${SQLITE_PROFILE}`);
    }
    const dir = outputDir();
    fs.mkdirSync(dir, { recursive: true });

    const ledgerCount = await exportLedger(dir);
    const stateCounts = await exportState(dir);
    logInfo({ msg: "local.export.completed", dir, ledgerCount, stateCounts });
}

await main().catch((error: unknown) => {
    logError({ msg: "local.export.failed", error: errorMessage(error) });
    process.exit(1);
});
