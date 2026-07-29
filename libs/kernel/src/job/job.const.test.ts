import { describe, expect, it } from "vitest";
import {
    JOB_STATUS,
    RULE_GENERATION_INTENT_MAX_LENGTH,
    isCancelableJobStatus,
    isTerminalJobStatus,
    normalizeRuleGenerationIntent,
} from "./job.const.js";

describe("isTerminalJobStatus", () => {
    it("완료·실패·취소를 종료 상태로 본다", () => {
        expect(isTerminalJobStatus(JOB_STATUS.completed)).toBe(true);
        expect(isTerminalJobStatus(JOB_STATUS.failed)).toBe(true);
        expect(isTerminalJobStatus(JOB_STATUS.canceled)).toBe(true);
    });

    it("대기·실행은 종료 상태가 아니다", () => {
        expect(isTerminalJobStatus(JOB_STATUS.pending)).toBe(false);
        expect(isTerminalJobStatus(JOB_STATUS.running)).toBe(false);
    });
});

describe("isCancelableJobStatus", () => {
    it("대기·실행 중인 잡만 취소할 수 있다", () => {
        expect(isCancelableJobStatus(JOB_STATUS.pending)).toBe(true);
        expect(isCancelableJobStatus(JOB_STATUS.running)).toBe(true);
    });

    it("종료된 잡은 취소할 수 없다", () => {
        expect(isCancelableJobStatus(JOB_STATUS.completed)).toBe(false);
        expect(isCancelableJobStatus(JOB_STATUS.failed)).toBe(false);
        expect(isCancelableJobStatus(JOB_STATUS.canceled)).toBe(false);
    });
});

describe("normalizeRuleGenerationIntent", () => {
    it("앞뒤 공백을 제거한 문구를 돌려준다", () => {
        expect(normalizeRuleGenerationIntent("  테스트 실행을 검증해줘  ")).toBe("테스트 실행을 검증해줘");
    });

    it("문자열이 아니거나 공백뿐이면 의도가 없는 것으로 본다", () => {
        expect(normalizeRuleGenerationIntent("   ")).toBeUndefined();
        expect(normalizeRuleGenerationIntent("")).toBeUndefined();
        expect(normalizeRuleGenerationIntent(undefined)).toBeUndefined();
        expect(normalizeRuleGenerationIntent(42)).toBeUndefined();
    });

    it("상한을 넘는 문구를 잘라낸다", () => {
        const long = "가".repeat(RULE_GENERATION_INTENT_MAX_LENGTH + 10);
        expect(normalizeRuleGenerationIntent(long)).toHaveLength(RULE_GENERATION_INTENT_MAX_LENGTH);
    });
});
