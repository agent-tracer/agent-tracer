import { z } from "zod";

const turnIndexSchema = z.number().int().min(1);

/** 살아 있는 세션을 자르지 않아 열린 구간이 생길 자리가 없으므로 구간의 끝은 언제나 필수다. */
export const splitBodySchema = z
    .object({
        sessionId: z.string().trim().min(1).max(64),
        fromTurnIndex: turnIndexSchema,
        toTurnIndex: turnIndexSchema,
        newTitle: z.string().trim().min(1).max(200).optional(),
        targetTaskId: z.string().trim().min(1).max(64).optional(),
    })
    .strict()
    .refine((body) => body.toTurnIndex >= body.fromTurnIndex, {
        message: "toTurnIndex must not be smaller than fromTurnIndex",
        path: ["toTurnIndex"],
    })
    .refine((body) => body.newTitle !== undefined || body.targetTaskId !== undefined, {
        message: "either newTitle or targetTaskId is required",
        path: ["newTitle"],
    })
    .refine((body) => body.newTitle === undefined || body.targetTaskId === undefined, {
        message: "newTitle and targetTaskId are mutually exclusive",
        path: ["targetTaskId"],
    });

export type SplitBody = z.infer<typeof splitBodySchema>;
