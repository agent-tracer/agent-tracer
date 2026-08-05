import type {
    PendingRuleGeneration,
    RuleGenerationFailure,
    RuleGenerationReport,
    RuleAnchorEvidence,
    RuleGenerationLeaseState,
} from "~plugin/domain/rulegen/model/rule.generation.model.js";

/** 규칙 생성 요청의 조회와 클레임과 종결을 서버 창구에 맡긴다. */
export interface RuleGenerationPort {
    pendingRequests(): Promise<readonly PendingRuleGeneration[]>;
    workspacePath(taskId: string): Promise<string | null>;
    anchor(taskId: string, anchorEventId: string): Promise<RuleAnchorEvidence | undefined>;
    claim(requestId: string): Promise<boolean>;
    renewLease(requestId: string): Promise<RuleGenerationLeaseState>;
    reportResult(requestId: string, report: RuleGenerationReport): Promise<boolean>;
    fail(requestId: string, failure: RuleGenerationFailure): Promise<void>;
    release(requestId: string): Promise<void>;
    hasActiveRequest(taskId: string): Promise<boolean>;
    enqueue(taskId: string, anchorEventId: string, maxRules: number): Promise<boolean>;
}
