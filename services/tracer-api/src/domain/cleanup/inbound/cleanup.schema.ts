import { z } from "zod";
import { CLEANUP_SUGGESTION_STATUSES } from "@agent-tracer/kernel";

export const listQuerySchema = z.object({ status: z.enum(CLEANUP_SUGGESTION_STATUSES).optional() });

export type ListQuery = z.infer<typeof listQuerySchema>;
