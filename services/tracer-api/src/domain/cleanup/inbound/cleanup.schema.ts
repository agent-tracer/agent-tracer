import { z } from "zod";
import {
    CLEANUP_SUGGESTION_STATUSES,
    TASK_CLEANUP_MAX_SUGGESTIONS,
    TASK_CLEANUP_SUGGESTION_KINDS,
} from "@agent-tracer/kernel";

export const listQuerySchema = z.object({ status: z.enum(CLEANUP_SUGGESTION_STATUSES).optional() });

const draftSchema = z.object({
    taskId: z.string().trim().min(1).max(64),
    kind: z.enum(TASK_CLEANUP_SUGGESTION_KINDS),
    rationale: z.string().trim().min(1).max(500),
});

export const createBodySchema = z.object({
    suggestions: z.array(draftSchema).min(1).max(TASK_CLEANUP_MAX_SUGGESTIONS),
    jobId: z.string().trim().min(1).max(200).nullish(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createBodySchema>;
