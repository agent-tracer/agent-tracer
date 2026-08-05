import { describe, expect, it } from "vitest";
import {
    JOB_STATUS,
    isCancelableJobStatus,
    isTerminalJobStatus,
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
