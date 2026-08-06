export interface TimelineItemSubtypeDto {
    readonly key: string;
    readonly label: string;
    readonly group: string;
    readonly toolFamily: string;
    readonly operation: string;
    readonly sourceTool?: string;
    readonly entityType?: string;
    readonly entityName?: string;
}

export interface TimelineItemDto {
    readonly id: string;
    readonly seq: string;
    readonly taskId: string;
    readonly sessionId?: string;
    readonly turnId?: string;
    readonly kind: string;
    readonly lane: string;
    readonly title: string;
    readonly displayTitle: string;
    readonly body?: string;
    readonly toolName?: string;
    readonly filePaths: readonly string[];
    readonly metadata: Record<string, unknown>;
    readonly occurredAt: string;
    readonly subtype?: TimelineItemSubtypeDto;
    readonly evidenceLevel?: string;
}

export interface TurnVerdictDto {
    readonly ruleId: string;
    readonly status: string;
}

/** 이 태스크에서 다른 태스크로 옮겨 간 턴 구간이며, 원본 피드가 구멍을 설명할 때 읽는다. */
export interface TurnSplitRangeDto {
    readonly fromTurnIndex: number;
    readonly toTurnIndex: number;
    readonly taskId: string;
    readonly movedAt: string;
}

/** 실행 중에 남긴 경계 마커가 가리키는, 사후 분리가 쓸 수 있는 턴 구간이다. */
export interface TurnBoundaryDto {
    readonly sessionId: string;
    readonly fromTurnIndex: number;
    readonly toTurnIndex: number;
    readonly label: string;
    readonly markedAt: string;
}

export interface TurnDto {
    readonly id: string;
    readonly taskId: string;
    readonly sessionId: string;
    readonly turnIndex: number;
    readonly status: string;
    readonly startedAt: string;
    readonly endedAt: string | null;
    readonly askedText: string | null;
    readonly assistantText: string | null;
    readonly aggregateVerdict: string | null;
    readonly rulesEvaluatedCount: number;
    readonly verdicts: readonly TurnVerdictDto[];
}
