import { describe, expect, it } from "vitest";
import { timelineQuerySchema } from "~tracer-api/domain/timeline/inbound/timeline.query.schema.js";

describe("timelineQuerySchema", () => {
    it("커서 없이도 질의를 세운다", () => {
        const parsed = timelineQuerySchema.safeParse({ limit: "2" });

        expect(parsed.success).toBe(true);
    });

    it("원장의 seq 를 커서로 받는다", () => {
        const parsed = timelineQuerySchema.safeParse({ cursor: "42" });

        expect(parsed.success).toBe(true);
    });

    // 커서 자리에 이벤트 식별자가 오면 질의가 bigint 변환에서 터져 500 이 나가던 자리다.
    it("숫자가 아닌 커서는 질의에 닿기 전에 거절한다", () => {
        const parsed = timelineQuerySchema.safeParse({ cursor: "01KZBP6F1WME7NXQK6HW9TN7Y6" });

        expect(parsed.success).toBe(false);
    });
});
