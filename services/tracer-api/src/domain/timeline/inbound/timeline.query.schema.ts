import { z } from "zod";

// 커서는 이벤트 식별자가 아니라 원장의 seq 이므로 숫자가 아닌 값은 질의에 닿기 전에 거절한다.
export const timelineQuerySchema = z.object({
    cursor: z
        .string()
        .regex(/^\d+$/, "cursor must be a sequence number")
        .optional(),
    limit: z.coerce.number().int().positive().optional(),
    order: z.enum(["asc", "desc"]).optional(),
});

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
