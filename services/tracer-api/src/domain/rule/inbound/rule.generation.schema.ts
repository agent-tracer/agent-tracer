import { RULE_GENERATION_MAX_RULES_LIMIT, RULE_GENERATION_STATUSES } from "@agent-tracer/kernel";
import { ruleProposalSchema } from "@agent-tracer/kernel/rule/proposal/rule.proposal.schema.js";
import { z } from "zod";

export const requestRuleGenerationBodySchema = z.object({
    taskId: z.string().trim().min(1),
    /** 규칙이 검증할 사용자 입력이며 판정 창이 여기서 시작한다. */
    anchorEventId: z.string().trim().min(1),
    intent: z.string().trim().min(1).optional(),
    maxRules: z.number().int().min(1).max(RULE_GENERATION_MAX_RULES_LIMIT).optional(),
});

const observationSchema = z.object({
    model: z.string().trim().min(1).nullable().default(null),
    costUsd: z.number().nullable().default(null),
    numTurns: z.number().int().nullable().default(null),
    durationMs: z.number().int().nullable().default(null),
    inputTokens: z.number().int().nullable().default(null),
    outputTokens: z.number().int().nullable().default(null),
    cacheReadTokens: z.number().int().nullable().default(null),
    cacheCreationTokens: z.number().int().nullable().default(null),
});

const stepsSchema = z
    .array(
        z.object({
            seq: z.number().int().min(0),
            role: z.string().trim().min(1),
            content: z.string(),
            toolName: z.string().trim().min(1).optional(),
        }),
    )
    .max(500)
    .default([]);

export const completeRuleGenerationBodySchema = z.object({
    rules: z.array(ruleProposalSchema).max(RULE_GENERATION_MAX_RULES_LIMIT).default([]),
    /** 근거가 서지 않아 버린 제안의 사유다. */
    skipped: z.array(z.string().trim().min(1)).max(50).default([]),
    observation: observationSchema,
    steps: stepsSchema,
});

export const failRuleGenerationBodySchema = z.object({
    message: z.string().trim().min(1).max(2000),
    observation: observationSchema,
    steps: stepsSchema,
});

export const listRuleGenerationsQuerySchema = z.object({
    status: z.enum(RULE_GENERATION_STATUSES as [string, ...string[]]).optional(),
    taskId: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type RequestRuleGenerationBody = z.infer<typeof requestRuleGenerationBodySchema>;
export type CompleteRuleGenerationBody = z.infer<typeof completeRuleGenerationBodySchema>;
export type FailRuleGenerationBody = z.infer<typeof failRuleGenerationBodySchema>;
export type ListRuleGenerationsQuery = z.infer<typeof listRuleGenerationsQuerySchema>;
