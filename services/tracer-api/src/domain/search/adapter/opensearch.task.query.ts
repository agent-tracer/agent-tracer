import { Inject, Injectable } from "@nestjs/common";
import { Client } from "@opensearch-project/opensearch";
import type { TaskSearchHit, TaskSearchPort } from "~tracer-api/domain/search/port/task.search.port.js";
import { OPENSEARCH_CLIENT, TASKS_INDEX } from "~tracer-api/config/opensearch.client.const.js";
import { readString } from "~tracer-api/domain/search/adapter/opensearch.field.reader.js";

interface SearchResponseBody {
    readonly hits: {
        readonly hits: ReadonlyArray<{ readonly _source?: Record<string, unknown> }>;
    };
}

/** OpenSearch SDK를 태스크 전문검색 포트에 맞추는 어댑터다. */
@Injectable()
export class OpenSearchTaskQuery implements TaskSearchPort {
    constructor(@Inject(OPENSEARCH_CLIENT) private readonly client: Client) {}

    async search(userId: string, q: string, limit: number): Promise<TaskSearchHit[]> {
        const response = await this.client.search({
            index: TASKS_INDEX,
            body: {
                size: limit,
                query: {
                    bool: {
                        must: [{ multi_match: { query: q, fields: ["title", "workspacePath"] } }],
                        filter: [{ term: { userId } }],
                        // OpenSearch term은 필드가 없는 문서에 매치하지 않아, hidden=false 필터는 필드 부재 문서까지 탈락시킨다.
                        must_not: [{ term: { hidden: true } }],
                    },
                },
            },
        });
        const body = response.body as unknown as SearchResponseBody;
        const hits: TaskSearchHit[] = [];
        for (const hit of body.hits.hits) {
            const mapped = toTaskHit(hit._source ?? {});
            if (mapped !== null) hits.push(mapped);
        }
        return hits;
    }
}

// 문서 ID는 (userId, taskId) 복합 키라 바깥 계약에 노출하지 않고, taskId는 문서 본문에서 읽는다.
function toTaskHit(source: Record<string, unknown>): TaskSearchHit | null {
    const taskId = readString(source["taskId"]);
    if (taskId === undefined) return null;
    return {
        id: taskId,
        taskId,
        title: readString(source["title"]) ?? "",
        status: readString(source["status"]) ?? "",
        ...(readString(source["origin"]) !== undefined ? { origin: readString(source["origin"])! } : {}),
        ...(readString(source["taskKind"]) !== undefined ? { taskKind: readString(source["taskKind"])! } : {}),
        ...(readString(source["workspacePath"]) !== undefined ? { workspacePath: readString(source["workspacePath"])! } : {}),
        archived: source["archived"] === true,
        ...(readString(source["updatedAt"]) !== undefined ? { updatedAt: readString(source["updatedAt"])! } : {}),
    };
}
