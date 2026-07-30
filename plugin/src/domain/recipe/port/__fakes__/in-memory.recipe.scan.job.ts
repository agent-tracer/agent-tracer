import type {RecipeScanJobPort} from "~plugin/domain/recipe/port/recipe.scan.job.port.js";

export interface RecordedScanEnqueue {
    readonly taskId: string;
    readonly idempotencyKey: string;
    readonly userPrompt?: string;
}

export class InMemoryRecipeScanJob implements RecipeScanJobPort {
    readonly enqueued: RecordedScanEnqueue[] = [];
    private active = false;
    private available = true;

    /** 태스크에 이미 진행 중인 스캔이 있는 상황을 재현한다. */
    markActive(): void {
        this.active = true;
    }

    /** 배포에 에이전트 서비스가 없는 상황을 재현한다. */
    markUnavailable(): void {
        this.available = false;
    }

    async hasActiveScan(): Promise<boolean> {
        return this.active;
    }

    async isAvailable(): Promise<boolean> {
        return this.available;
    }

    async enqueue(taskId: string, idempotencyKey: string, userPrompt?: string): Promise<boolean> {
        if (!this.available) return false;
        this.enqueued.push({taskId, idempotencyKey, ...(userPrompt !== undefined ? {userPrompt} : {})});
        return true;
    }
}
