import type {SchedulerPort} from "~plugin/domain/rulegen/port/scheduler.port.js";

export class ManualScheduler implements SchedulerPort {
    private readonly runs: Array<() => void> = [];

    every(_intervalMs: number, run: () => void): () => void {
        this.runs.push(run);
        return () => {
            const index = this.runs.indexOf(run);
            if (index >= 0) this.runs.splice(index, 1);
        };
    }

    get pending(): number {
        return this.runs.length;
    }

    tick(): void {
        // every가 돌려준 해지 함수가 runs를 splice하므로, 순회 중 자기 해지를 견디려면 사본을 쓴다.
        const snapshot = this.runs.slice();
        for (const run of snapshot) run();
    }
}
