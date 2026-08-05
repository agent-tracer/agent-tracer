import type {
    PendingRuleGeneration,
    RuleGenerationFailure,
    RuleAnchorEvidence,
    RuleGenerationReport,
    RuleGenerationLeaseState,
} from "~plugin/domain/rulegen/model/rule.generation.model.js";
import type {RuleGenerationPort} from "~plugin/domain/rulegen/port/rule.generation.port.js";

export interface RecordedEnqueue {
    readonly taskId: string;
    readonly anchorEventId: string;
    readonly maxRules: number;
}

export class InMemoryRuleGeneration implements RuleGenerationPort {
    readonly claimed: string[] = [];
    readonly released: string[] = [];
    readonly failed: {requestId: string; error: string}[] = [];
    readonly failures: {requestId: string; failure: RuleGenerationFailure}[] = [];
    readonly reported: {requestId: string; report: RuleGenerationReport}[] = [];
    readonly enqueued: RecordedEnqueue[] = [];
    readonly renewed: string[] = [];

    workspaces = new Map<string, string>();
    anchors = new Map<string, RuleAnchorEvidence>();
    lease: RuleGenerationLeaseState = {leaseHeld: true, canceled: false};
    claimable = true;
    reportOk = true;
    activeJob = false;
    enqueueOk = true;

    constructor(private readonly jobs: readonly PendingRuleGeneration[] = []) {}

    async pendingRequests(): Promise<readonly PendingRuleGeneration[]> {
        return this.jobs;
    }

    async workspacePath(taskId: string): Promise<string | null> {
        return this.workspaces.get(taskId) ?? null;
    }

    async anchor(_taskId: string, anchorEventId: string): Promise<RuleAnchorEvidence | undefined> {
        return this.anchors.get(anchorEventId);
    }

    async claim(requestId: string): Promise<boolean> {
        if (!this.claimable) return false;
        this.claimed.push(requestId);
        return true;
    }

    async renewLease(requestId: string): Promise<RuleGenerationLeaseState> {
        this.renewed.push(requestId);
        return this.lease;
    }

    async reportResult(requestId: string, report: RuleGenerationReport): Promise<boolean> {
        this.reported.push({requestId, report});
        return this.reportOk;
    }

    async fail(requestId: string, failure: RuleGenerationFailure): Promise<void> {
        this.failed.push({requestId, error: failure.error});
        this.failures.push({requestId, failure});
    }

    async release(requestId: string): Promise<void> {
        this.released.push(requestId);
    }

    async hasActiveRequest(_taskId: string): Promise<boolean> {
        return this.activeJob;
    }

    async enqueue(taskId: string, anchorEventId: string, maxRules: number): Promise<boolean> {
        this.enqueued.push({taskId, anchorEventId, maxRules});
        return this.enqueueOk;
    }
}
