import {LOCAL_JOB_LEASE_HEARTBEAT_MS} from "@agent-tracer/kernel/job/job.const.js";
import {
    readRuleRequest,
    type RuleGenerationSettingCache,
} from "~plugin/domain/rulegen/model/rule.command.model.js";
import {
    readJobAnchorEventId,
    ruleGenerationFailure,
    toRuleGenerationRequest,
    type PendingRuleJob,
    type RuleJobRunner,
} from "~plugin/domain/rulegen/model/rule.job.model.js";
import type {RulegenLogPort} from "~plugin/domain/rulegen/port/log.port.js";
import type {RuleJobPort} from "~plugin/domain/rulegen/port/rule.job.port.js";
import type {SchedulerPort} from "~plugin/domain/rulegen/port/scheduler.port.js";

const MAX_CONCURRENT_JOBS = 2;

/** 대기 중인 규칙 생성 잡을 클레임해 로컬 실행기에 넘기고 리스를 살려 둔다. */
export class PollRuleJobsUsecase {
    private readonly running = new Map<string, AbortController>();

    constructor(
        private readonly jobs: RuleJobPort,
        private readonly runner: RuleJobRunner,
        private readonly scheduler: SchedulerPort,
        private readonly settings: RuleGenerationSettingCache,
        private readonly log: RulegenLogPort,
        private readonly maxConcurrent: number = MAX_CONCURRENT_JOBS,
    ) {}

    hasRunning(): boolean {
        return this.running.size > 0;
    }

    /** 데몬이 내려갈 때 실행을 끊고 잡을 서버에 반납한다. */
    async releaseRunning(): Promise<void> {
        const jobIds = [...this.running.keys()];
        for (const [jobId, cancel] of this.running) {
            cancel.abort(new Error("daemon shutting down"));
            this.log.write(`releasing job ${jobId} on shutdown`);
        }
        this.running.clear();
        await Promise.all(
            jobIds.map((jobId) => this.jobs.release(jobId).catch(() => this.log.write(`failed to release job ${jobId}`))),
        );
    }

    async execute(): Promise<void> {
        if (!this.settings.isSupported()) return;
        let pending: readonly PendingRuleJob[];
        try {
            pending = await this.jobs.pendingJobs();
        } catch (error) {
            this.log.write(`could not read pending jobs: ${String(error)}`);
            return;
        }

        for (const job of pending) {
            if (this.running.size >= this.maxConcurrent) break;
            const taskId = job.taskId;
            if (taskId === null || taskId.length === 0 || this.running.has(job.id)) continue;
            await this.dispatch(job, taskId);
        }
    }

    private async dispatch(job: PendingRuleJob, taskId: string): Promise<void> {
        const anchorEventId = readJobAnchorEventId(job);
        if (anchorEventId === undefined) {
            await this.failInvalidAnchor(job.id, "rule generation request has no anchor event");
            return;
        }
        // 클레임을 먼저 걸어야 집지 못할 요청에 왕복을 쓰지 않는다.
        if (!await this.claim(job.id)) return;

        const context = await this.gather(taskId, anchorEventId);
        if (typeof context === "string") {
            await this.failInvalidAnchor(job.id, context);
            return;
        }
        const settings = this.settings.snapshot();
        const request = toRuleGenerationRequest(job, taskId, {
            ...context,
            anchorEventId,
            model: settings.model,
            language: settings.outputLanguage,
            effort: settings.effort,
        });

        const cancel = new AbortController();
        this.running.set(job.id, cancel);
        const stopHeartbeat = this.startHeartbeat(job.id, cancel);
        this.log.write(`starting request ${job.id} for task ${taskId}`);

        void this.runner(request, cancel.signal)
            .then(() => this.log.write(`job ${job.id} completed`))
            .catch((error: unknown) => {
                this.log.write(`job ${job.id} threw: ${String(error)}`);
                if (cancel.signal.aborted) return;
                void this.jobs.fail(job.id, ruleGenerationFailure(String(error)))
                    .catch(() => this.log.write(`failed to mark job ${job.id} failed after throw`));
            })
            .finally(() => {
                stopHeartbeat();
                this.running.delete(job.id);
            });
    }

    /** 클레임에 실패한 요청은 남이 쥐었거나 사라진 것이므로 조용히 넘긴다. */
    private async claim(jobId: string): Promise<boolean> {
        try {
            if (await this.jobs.claim(jobId)) return true;
            this.log.write(`could not claim request ${jobId}, skipping`);
        } catch (error) {
            this.log.write(`could not claim request ${jobId}: ${String(error)}`);
        }
        return false;
    }

    /** 실행에 필요한 것을 모으며 모으지 못한 사유는 그대로 실패 문구가 된다. */
    private async gather(
        taskId: string,
        anchorEventId: string,
    ): Promise<{readonly workspacePath: string; readonly anchorText: string; readonly anchorTurnId: string | null} | string> {
        const workspacePath = await this.jobs.workspacePath(taskId);
        if (workspacePath === null) return `task ${taskId} has no workspacePath`;
        const anchor = await this.jobs.anchor(taskId, anchorEventId);
        if (anchor === undefined) return `anchor ${anchorEventId} is not an owned user message`;
        return {workspacePath, anchorText: toRuleRequestText(anchor.text), anchorTurnId: anchor.turnId};
    }

    private async failInvalidAnchor(jobId: string, error: string): Promise<void> {
        this.log.write(`${error}, failing job ${jobId}`);
        await this.jobs.fail(jobId, ruleGenerationFailure(error))
            .catch(() => this.log.write(`failed to mark job ${jobId} failed`));
    }

    private startHeartbeat(jobId: string, cancel: AbortController): () => void {
        return this.scheduler.every(LOCAL_JOB_LEASE_HEARTBEAT_MS, () => {
            void this.jobs.renewLease(jobId)
                .then((state) => {
                    if (!state.leaseHeld || state.canceled) cancel.abort(new Error("job canceled"));
                })
                .catch(() => undefined);
        });
    }
}

/** 근거 텍스트는 사용자가 친 원문이므로 명령 접두사를 벗겨 요구만 남긴다. */
function toRuleRequestText(anchorText: string): string {
    const request = readRuleRequest(anchorText);
    return request.length > 0 ? request : anchorText;
}
