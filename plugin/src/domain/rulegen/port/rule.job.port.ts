import type {
    PendingRuleJob,
    RuleGenerationFailure,
    RuleGenerationReport,
    RuleAnchorEvidence,
    RuleJobLeaseState,
} from "~plugin/domain/rulegen/model/rule.job.model.js";

/** 규칙 생성 요청의 조회와 클레임과 종결을 서버 창구에 맡긴다. */
export interface RuleJobPort {
    pendingJobs(): Promise<readonly PendingRuleJob[]>;
    workspacePath(taskId: string): Promise<string | null>;
    anchor(taskId: string, anchorEventId: string): Promise<RuleAnchorEvidence | undefined>;
    claim(jobId: string): Promise<boolean>;
    renewLease(jobId: string): Promise<RuleJobLeaseState>;
    reportResult(jobId: string, report: RuleGenerationReport): Promise<boolean>;
    fail(jobId: string, failure: RuleGenerationFailure): Promise<void>;
    release(jobId: string): Promise<void>;
    hasActiveJob(taskId: string): Promise<boolean>;
    enqueue(taskId: string, anchorEventId: string, maxRules: number): Promise<boolean>;
}
