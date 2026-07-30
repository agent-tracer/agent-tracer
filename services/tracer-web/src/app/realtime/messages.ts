import type { MonitoringSession, MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { JobKind, JobStatus } from "~tracer-web/entities/job/model/job.js";
import type { TimelineItemDto } from "@agent-tracer/kernel";
export interface RuleEnforcementAddedPayload {
    readonly eventId: string;
    readonly ruleId: string;
    readonly matchKind: "trigger" | "expect-fulfilled";
    readonly taskId: string;
    readonly sessionId?: string;
}

export interface VerdictUpdatedPayload {
    readonly turnId: string;
    readonly sessionId: string;
    readonly taskId: string;
    readonly aggregateVerdict: "open" | "satisfied" | "unmet" | "unknown" | null;
    readonly rulesEvaluatedCount: number;
}

export interface RulesChangedPayload {
    readonly ruleId: string;
    readonly change: "created" | "updated" | "deleted" | "promoted";
    readonly scope: "global" | "task";
    readonly taskId?: string;
}

export interface JobUpdatedPayload {
    readonly kind: JobKind;
    readonly status: JobStatus;
    readonly taskId?: string;
    readonly jobId?: string;
    readonly summary?: string;
    readonly error?: string;
    readonly durationMs?: number;
}

export type MonitorRealtimeMessage = {
    readonly type: "task.started" | "task.updated";
    readonly payload: MonitoringTask;
} | {
    readonly type: "task.deleted";
    readonly payload: {
        readonly taskId: string;
    };
} | {
    readonly type: "session.started" | "session.ended";
    readonly payload: MonitoringSession;
} | {
    readonly type: "event.logged" | "event.updated";
    readonly payload: TimelineItemDto;
} | {
    readonly type: "tasks.purged";
    readonly payload: {
        readonly count: number;
    };
} | {
    readonly type: "rule_enforcement.added";
    readonly payload: RuleEnforcementAddedPayload;
} | {
    readonly type: "verdict.updated";
    readonly payload: VerdictUpdatedPayload;
} | {
    readonly type: "rules.changed";
    readonly payload: RulesChangedPayload;
} | {
    readonly type: "job.updated";
    readonly payload: JobUpdatedPayload;
};
export function parseRealtimeMessage(raw: string): MonitorRealtimeMessage | null {
    try {
        const value = JSON.parse(raw) as {
            type?: unknown;
        };
        return typeof value.type === "string"
            ? value as MonitorRealtimeMessage
            : null;
    }
    catch {
        return null;
    }
}
