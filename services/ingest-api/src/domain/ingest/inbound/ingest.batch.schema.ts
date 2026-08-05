import { z } from "zod";
import { parseIngestBatch } from "@agent-tracer/kernel/ingest/ingest.schema.js";

// 봉투 오류만 400으로 매핑하고 개별 레코드 오류는 응답 본문에 담는다.
export const ingestBatchRequestSchema = z.unknown().transform((value, ctx) => {
    try {
        return parseIngestBatch(value);
    } catch (error) {
        if (error instanceof z.ZodError) {
            // 응답 봉투는 사유를 경로별 메시지로만 싣으므로 자리와 문장을 그대로 옮겨 담는다.
            for (const issue of error.issues) {
                ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
            }
        } else {
            ctx.addIssue({ code: "custom", message: "invalid ingest batch" });
        }
        return z.NEVER;
    }
});
