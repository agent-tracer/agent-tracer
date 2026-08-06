import type { ResumeTargetDto, SessionDto } from "@agent-tracer/kernel";
import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import type { MonitoringTask, MonitoringTaskOrigin, MonitoringTaskStatus } from "~tracer-web/entities/task/model/task.js";

/** 엔티티 간 참조 없이 task 슬라이스가 소유하는 verdict 상태 표현이다. */
export type TaskTurnVerdictStatus = "open" | "satisfied" | "unmet" | "unknown";

export type TasksArchivedScope = "active" | "archived" | "all";
export type TasksOriginFilter = MonitoringTaskOrigin | "all";
export type TasksStatusFilter = MonitoringTaskStatus | "all";

export interface TaskListQuery {
  readonly archived?: TasksArchivedScope;
  readonly origin?: TasksOriginFilter;
  readonly status?: TasksStatusFilter;
  readonly rootOnly?: boolean;
}

export interface TaskPageQuery extends TaskListQuery {
  readonly limit?: number;
  readonly cursor?: string;
}

export interface TaskPageInfo {
  readonly limit: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

export interface TasksResponse {
  readonly tasks: readonly MonitoringTask[];
  readonly page?: TaskPageInfo;
}

export interface TaskChildrenResponse {
  readonly tasks: readonly MonitoringTask[];
}

export interface TaskDetailResponse {
  readonly task: MonitoringTask;
  readonly timeline: readonly TimelineEventRecord[];
  readonly olderCursor?: string | null;
  readonly sessions?: readonly SessionDto[];
  readonly resumeTarget?: ResumeTargetDto;
  readonly turns?: readonly TaskTurnSummary[];
  readonly splits?: readonly TaskSplitRange[];
}

export interface TaskTimelineResponse {
  readonly timeline: readonly TimelineEventRecord[];
  readonly olderCursor: string | null;
}

export interface TaskTurnsResponse {
  readonly turns: readonly TaskTurnSummary[];
  readonly splits: readonly TaskSplitRange[];
}

/** 이 태스크에서 다른 태스크로 옮겨 간 턴 구간이며, 피드가 턴 인덱스가 뛰는 자리를 설명한다. */
export interface TaskSplitRange {
  readonly fromTurnIndex: number;
  readonly toTurnIndex: number;
  readonly taskId: string;
  readonly movedAt: string;
}

/** 실행 중에 남긴 경계 마커가 가리키는 분리 제안 구간이다. */
export interface TaskBoundarySuggestion {
  readonly sessionId: string;
  readonly fromTurnIndex: number;
  readonly toTurnIndex: number;
  readonly label: string;
  readonly markedAt: string;
}

export interface TaskTurnSummary {
  readonly id: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly turnIndex: number;
  readonly status: "open" | "closed";
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly aggregateVerdict: TaskTurnVerdictStatus | null;
  readonly rulesEvaluatedCount: number;
  /** 그 턴을 연 사용자 발화이며 분리 대상을 고를 때 무엇을 옮기는지 보인다. */
  readonly askedText: string | null;
}

export interface TaskUserInput {
  readonly eventId: string;
  readonly text: string;
  readonly turnId: string | null;
  readonly occurredAt: string;
}

/** 스캔 앵커 후보를 사용자 완료 루트 태스크로 제한하는 목록 질의를 만든다. */
export function scanAnchorTaskQuery(includeArchived: boolean): TaskPageQuery {
  return {
    origin: "user",
    status: "completed",
    rootOnly: true,
    archived: includeArchived ? "all" : "active",
  };
}
