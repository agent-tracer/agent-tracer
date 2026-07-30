import {JOB_KIND, JOB_STATUS, RECIPE_SCAN_TRIGGER} from "@agent-tracer/kernel/job/job.const.js";
import {getJson, postJson} from "~plugin/config/http.js";
import type {RecipeScanJobPort} from "~plugin/domain/recipe/port/recipe.scan.job.port.js";

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([JOB_STATUS.pending, JOB_STATUS.running]);

// 잡은 에이전트 서비스가 소유하므로 게이트웨이의 에이전트 접두사 아래로 부른다.
const AGENT_JOBS = "/api/agent/jobs";

interface LatestJobEnvelope {
    readonly data?: {readonly job: {readonly status: string} | null};
}

/** 레시피 스캔 잡을 서버 잡 API로 넣는다. */
export class HttpRecipeScanJobAdapter implements RecipeScanJobPort {
    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
    ) {}

    async hasActiveScan(taskId: string): Promise<boolean> {
        const url = `${this.baseUrl}${AGENT_JOBS}/latest?kind=${encodeURIComponent(JOB_KIND.recipeScan)}&taskId=${encodeURIComponent(taskId)}`;
        const fetched = await getJson<LatestJobEnvelope>(url, this.headers);
        const status = fetched.kind === "found" ? fetched.value.data?.job?.status : undefined;
        return status !== undefined && ACTIVE_STATUSES.has(status);
    }

    /** 이 창구를 세우는 에이전트 서비스가 배포에 없으면 `501`이 그 확답이다. */
    async isAvailable(): Promise<boolean> {
        const fetched = await getJson<unknown>(`${this.baseUrl}${AGENT_JOBS}`, this.headers);
        return fetched.kind !== "unsupported";
    }

    async enqueue(taskId: string, idempotencyKey: string, userPrompt?: string): Promise<boolean> {
        const response = await postJson(`${this.baseUrl}${AGENT_JOBS}`, this.headers, {
            kind: JOB_KIND.recipeScan,
            input: {
                taskId,
                trigger: RECIPE_SCAN_TRIGGER.session,
                ...(userPrompt !== undefined ? {userPrompt} : {}),
            },
            idempotencyKey,
        });
        return response.ok;
    }
}
