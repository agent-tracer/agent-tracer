import { z } from "zod";
import { createMemoSchema, updateMemoSchema } from "@agent-tracer/kernel/memo/memo.schema.js";

export { createMemoSchema, updateMemoSchema };
export type { CreateMemoPayload, UpdateMemoPayload } from "@agent-tracer/kernel/memo/memo.schema.js";

export const listMemosQuerySchema = z.object({
    taskId: z.string().trim().min(1).optional(),
    eventId: z.string().trim().min(1).optional(),
});

export type ListMemosQuery = z.infer<typeof listMemosQuerySchema>;
