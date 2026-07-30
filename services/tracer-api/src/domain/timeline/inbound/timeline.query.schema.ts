import { z } from "zod";

export const timelineQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
    order: z.enum(["asc", "desc"]).optional(),
});

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
