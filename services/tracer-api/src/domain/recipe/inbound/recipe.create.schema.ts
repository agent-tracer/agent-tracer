import { z } from "zod";
import { RECIPE_EDITORS } from "@agent-tracer/kernel";

const evidenceSchema = z.array(z.string().trim().min(1)).min(1).max(50);

// 모든 단계가 이벤트로 관측되지는 않으므로 단계 근거만 비어 있는 것을 허용한다.
const optionalEvidenceSchema = z.array(z.string().trim().min(1)).max(50);

const applicabilitySchema = z.array(z.string().trim().min(1).max(200)).max(6);

const correctionSchema = z.object({
    whatAgentDid: z.string().trim().min(1).max(500),
    howCorrected: z.string().trim().min(1).max(500),
    evidence: evidenceSchema,
});

const pitfallSchema = z.object({
    pitfall: z.string().trim().min(1).max(500),
    whyNonObvious: z.string().trim().min(1).max(500),
    evidence: evidenceSchema,
});

// correction이 이미 symptom→action 쌍이라 같은 근거 요구를 그대로 물려받는다.
const recoverySchema = z.object({
    symptom: z.string().trim().min(1).max(500),
    action: z.string().trim().min(1).max(500),
    evidence: evidenceSchema,
    stepOrder: z.number().int().min(1).max(50).nullish(),
});

const verifySchema = z.discriminatedUnion("kind", [
    z.object({
        kind: z.literal("command"),
        commandMatches: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
    }),
    z.object({ kind: z.literal("pattern"), pattern: z.string().trim().min(1).max(500) }),
    z.object({ kind: z.literal("action"), tool: z.enum(["command", "file-read", "file-write", "web"]) }),
]);

const stepSchema = z.object({
    order: z.number().int().min(1).max(50),
    action: z.string().trim().min(1).max(200),
    rationale: z.string().trim().max(300).nullish(),
    evidence: optionalEvidenceSchema.default([]),
    verify: verifySchema.nullish(),
});

const touchedFileSchema = z.object({
    path: z.string().trim().min(1),
    role: z.enum(["read", "write", "both"]),
    why: z.string().trim().max(200).nullish(),
    loadWhen: z.string().trim().max(200).nullish(),
});

const sliceSchema = z.object({
    taskId: z.string().trim().min(1).max(64),
    turnIds: z.array(z.string().trim().min(1)),
    eventIds: z.array(z.string().trim().min(1)),
});

const draftSchema = z.object({
    title: z.string().trim().min(1).max(120),
    intent: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(400),
    useWhen: applicabilitySchema.default([]),
    summaryMd: z.string().trim().min(1).max(4000),
    request: z.string().trim().min(1).max(2000),
    inputs: applicabilitySchema.default([]),
    outputs: applicabilitySchema.default([]),
    rationale: z.string().trim().min(1).max(500),
    corrections: z.array(correctionSchema).max(20).default([]),
    pitfalls: z.array(pitfallSchema).max(20).default([]),
    recovery: z.array(recoverySchema).max(10).default([]),
    governingRules: z.array(z.string().trim().min(1)).max(50).default([]),
    steps: z.array(stepSchema).max(20).default([]),
    touchedFiles: z.array(touchedFileSchema).max(30).default([]),
    contributingSlices: z.array(sliceSchema).min(1).max(20),
    language: z.string().trim().min(1).max(16).nullish(),
    parentRecipeId: z.string().trim().min(1).max(200).nullish(),
    parentRecipeSeenRev: z.number().int().min(1).optional(),
}).refine(
    (draft) => draft.steps.every((step, index) => step.order === index + 1),
    { message: "steps must use consecutive order values starting at 1", path: ["steps"] },
);

export const createBodySchema = z.object({
    recipes: z.array(draftSchema).min(1).max(20),
    author: z.enum(RECIPE_EDITORS),
    sourceJobId: z.string().trim().min(1).max(200).nullish(),
});

export type CreateBody = z.infer<typeof createBodySchema>;
