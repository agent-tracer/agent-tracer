import type { RuleGenerationObservation, RuleGenerationStatus } from "@agent-tracer/kernel";
import type { RuleGenerationEntity } from "@agent-tracer/tracer-model";

/** 화면과 실행기가 함께 읽는 규칙 생성 요청의 표현이다. */
export interface RuleGenerationDto {
    readonly id: string;
    readonly taskId: string;
    readonly anchorEventId: string;
    readonly intent: string | null;
    readonly maxRules: number | null;
    readonly status: RuleGenerationStatus;
    readonly observation: RuleGenerationObservation;
    readonly skipped: readonly string[];
    readonly createdRuleIds: readonly string[];
    readonly error: string | null;
    readonly createdAt: string;
    readonly startedAt: string | null;
    readonly finishedAt: string | null;
}

export function mapRuleGeneration(request: RuleGenerationEntity): RuleGenerationDto {
    return {
        id: request.id,
        taskId: request.taskId,
        anchorEventId: request.anchorEventId,
        intent: request.intent,
        maxRules: request.maxRules,
        status: request.status,
        observation: request.observation,
        skipped: request.skipped,
        createdRuleIds: request.createdRuleIds,
        error: request.error,
        createdAt: request.createdAt.toISOString(),
        startedAt: request.startedAt?.toISOString() ?? null,
        finishedAt: request.finishedAt?.toISOString() ?? null,
    };
}

/** 궤적은 목록에 싣기엔 크므로 요청 하나를 펼쳐 볼 때만 함께 준다. */
export interface RuleGenerationDetailDto extends RuleGenerationDto {
    readonly steps: RuleGenerationEntity["steps"];
}

export function mapRuleGenerationDetail(request: RuleGenerationEntity): RuleGenerationDetailDto {
    return { ...mapRuleGeneration(request), steps: request.steps };
}
