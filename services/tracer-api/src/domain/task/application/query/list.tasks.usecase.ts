import { Inject, Injectable } from "@nestjs/common";
import type { TaskOrigin, TaskStatus } from "@agent-tracer/kernel";
import {
    decodeTaskPageCursor,
    encodeTaskPageCursor,
    type TaskListItemDto,
    type TaskPageFilter,
} from "@agent-tracer/tracer-model";
import { TASK_REPOSITORY, type TaskRepositoryPort } from "~tracer-api/domain/task/port/task.repository.port.js";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export interface ListTasksInput {
    readonly userId: string;
    readonly status?: TaskStatus;
    readonly origin?: TaskOrigin;
    readonly archived?: boolean;
    readonly rootOnly?: boolean;
    readonly parentTaskId?: string;
    readonly cursor?: string;
    readonly limit?: number;
}

export interface ListTasksResult {
    readonly items: readonly TaskListItemDto[];
    /** 같은 필터에 걸리는 전체 개수이며, 부를 쪽이 페이지를 몇 장 넘길지 미리 안다. */
    readonly total: number;
    readonly nextCursor: string | null;
}

@Injectable()
export class ListTasksUseCase {
    constructor(@Inject(TASK_REPOSITORY) private readonly tasks: TaskRepositoryPort) {}

    async execute(input: ListTasksInput): Promise<ListTasksResult> {
        const limit = clampLimit(input.limit);
        const filter: TaskPageFilter = {
            limit,
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.origin !== undefined ? { origin: input.origin } : {}),
            ...(input.archived !== undefined ? { archived: input.archived } : {}),
            ...(input.rootOnly !== undefined ? { rootOnly: input.rootOnly } : {}),
            ...(input.parentTaskId !== undefined ? { parentTaskId: input.parentTaskId } : {}),
            ...(input.cursor !== undefined ? { cursor: decodeTaskPageCursor(input.cursor) } : {}),
        };
        const [page, total] = await Promise.all([
            this.tasks.findVisiblePage(input.userId, filter),
            this.tasks.countVisible(input.userId, filter),
        ]);
        const items = page.map((view) => view.toListItem());

        const last = items.at(-1);
        const nextCursor =
            page.length === limit && last !== undefined
                ? encodeTaskPageCursor({ updatedAt: last.updatedAt, id: last.id })
                : null;
        return { items, total, nextCursor };
    }
}

function clampLimit(raw: number | undefined): number {
    if (raw === undefined || !Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT;
    return Math.min(Math.floor(raw), MAX_LIMIT);
}
