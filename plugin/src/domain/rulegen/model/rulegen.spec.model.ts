import {RULE_GENERATION_SETTINGS_DEFAULT} from "@agent-tracer/kernel";
import {buildAnchorBlock, buildAnchorDirective} from "~plugin/domain/rulegen/model/anchor.model.js";
import {DEFAULT_RULEGEN_DEADLINE_MS} from "~plugin/domain/rulegen/model/deadline.model.js";
import {buildIntentBlock, buildIntentDirective} from "~plugin/domain/rulegen/model/intent.model.js";
import {buildRuleOutputSchema} from "~plugin/domain/rulegen/model/output.schema.model.js";
import {
    buildRulegenSystemPrompt,
    buildRulegenUserPrompt,
} from "~plugin/domain/rulegen/model/rulegen.prompt.model.js";
import {RULEGEN_TOOL_SPECS, type RulegenToolSpec} from "~plugin/domain/rulegen/model/rulegen.tool.model.js";

export const RULEGEN_FALLBACK_MODEL = "claude-haiku-4-5";
export const DEFAULT_RULEGEN_BUDGET_USD = 2;
export const RULEGEN_MAX_TURNS = 15;
export const RULEGEN_MAX_OUTPUT_TOKENS = 8_000;

/** 잡 하나를 규칙 생성 실행에 넘기는 입력이다. */
export interface RuleGenerationRequest {
    readonly jobId: string;
    readonly taskId: string;
    readonly workspacePath: string;
    readonly maxRules?: number;
    readonly intent?: string;
    readonly anchorText: string;
    readonly anchorEventId: string;
    readonly anchorTurnId?: string;
    readonly language: string;
    readonly model: string;
    readonly effort: string;
}

/** 실행기가 그대로 집행하는 규칙 생성 명세이며 제품 규칙은 전부 여기에 담긴다. */
export interface RuleGenerationSpec {
    readonly jobId: string;
    readonly taskId: string;
    readonly workspacePath: string;
    readonly model: string;
    readonly fallbackModel: string;
    readonly maxRules: number;
    readonly maxTurns: number;
    readonly maxBudgetUsd: number;
    readonly maxOutputTokens: number;
    readonly effort: string;
    readonly deadlineMs: number;
    readonly systemPrompt: string;
    readonly userPrompt: string;
    readonly outputSchema: Record<string, unknown>;
    readonly tools: readonly RulegenToolSpec[];
}

export function buildRuleGenerationSpec(request: RuleGenerationRequest): RuleGenerationSpec {
    const maxRules = request.maxRules ?? RULE_GENERATION_SETTINGS_DEFAULT.maxRulesPerTask;
    const anchorDirective = buildAnchorDirective(request.anchorText);
    const intentDirective = buildIntentDirective(request.intent);
    return {
        jobId: request.jobId,
        taskId: request.taskId,
        workspacePath: request.workspacePath,
        model: request.model,
        fallbackModel: RULEGEN_FALLBACK_MODEL,
        maxRules,
        maxTurns: RULEGEN_MAX_TURNS,
        maxBudgetUsd: DEFAULT_RULEGEN_BUDGET_USD,
        maxOutputTokens: RULEGEN_MAX_OUTPUT_TOKENS,
        effort: request.effort,
        deadlineMs: DEFAULT_RULEGEN_DEADLINE_MS,
        systemPrompt: buildRulegenSystemPrompt({
            maxRules,
            maxTurns: RULEGEN_MAX_TURNS,
            language: request.language,
            anchorDirective,
            intentDirective,
            tools: RULEGEN_TOOL_SPECS,
        }),
        userPrompt: buildRulegenUserPrompt({
            taskId: request.taskId,
            workspacePath: request.workspacePath,
            maxRules,
            anchorBlock: buildAnchorBlock(request.anchorText),
            intentBlock: buildIntentBlock(request.intent),
            anchorTurnId: request.anchorTurnId ?? null,
            anchorEventId: request.anchorEventId,
        }),
        outputSchema: buildRuleOutputSchema(),
        tools: RULEGEN_TOOL_SPECS,
    };
}
