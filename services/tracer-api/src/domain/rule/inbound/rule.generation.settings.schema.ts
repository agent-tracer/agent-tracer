import {
    RULE_GENERATION_EFFORTS,
    RULE_GENERATION_LANGUAGES,
    RULE_GENERATION_MAX_RULES_LIMIT,
} from "@agent-tracer/kernel";
import { z } from "zod";

export const ruleGenerationSettingsBodySchema = z.object({
    maxRulesPerTask: z.number().int().min(1).max(RULE_GENERATION_MAX_RULES_LIMIT).nullable().optional(),
    model: z.string().trim().min(1).max(120).nullable().optional(),
    outputLanguage: z.enum(RULE_GENERATION_LANGUAGES as [string, ...string[]]).nullable().optional(),
    effort: z.enum(RULE_GENERATION_EFFORTS as [string, ...string[]]).nullable().optional(),
});

export type RuleGenerationSettingsBody = z.infer<typeof ruleGenerationSettingsBodySchema>;
