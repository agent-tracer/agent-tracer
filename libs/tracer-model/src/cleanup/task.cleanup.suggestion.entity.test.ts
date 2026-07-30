import { describe, expect, it } from "vitest";
import { CLEANUP_SUGGESTION_STATUS, TASK_CLEANUP_SUGGESTION_KIND } from "@agent-tracer/kernel";
import { TaskCleanupSuggestionEntity } from "./task.cleanup.suggestion.entity.js";
import { InvariantViolationError } from "../error/invariant.error.js";

function makeSuggestion(): TaskCleanupSuggestionEntity {
    const suggestion = new TaskCleanupSuggestionEntity();
    suggestion.status = CLEANUP_SUGGESTION_STATUS.pending;
    suggestion.resolvedAt = null;
    return suggestion;
}

describe("TaskCleanupSuggestionEntity", () => {
    describe("pending", () => {
        it("대조할 값을 비운 대기 제안을 만든다", () => {
            const at = new Date("2026-01-01T00:00:00.000Z");
            const observed = new Date("2025-12-31T00:00:00.000Z");
            const suggestion = TaskCleanupSuggestionEntity.pending(
                {
                    id: "c1",
                    userId: "u1",
                    jobId: "job-1",
                    taskId: "t1",
                    kind: TASK_CLEANUP_SUGGESTION_KIND.archive,
                    rationale: "마지막 활동 이후 오래 멈춰 있다",
                    observedLastEventAt: observed,
                },
                at,
            );
            expect(suggestion.status).toBe(CLEANUP_SUGGESTION_STATUS.pending);
            expect(suggestion.currentValue).toBeNull();
            expect(suggestion.proposedValue).toBeNull();
            expect(suggestion.resolvedAt).toBeNull();
            expect(suggestion.createdAt).toEqual(at);
            expect(suggestion.observedLastEventAt).toEqual(observed);
        });
    });

    describe("restate", () => {
        it("대기 제안의 근거와 실행과 관측 시각을 새 것으로 고친다", () => {
            const suggestion = makeSuggestion();
            const observed = new Date("2026-02-01T00:00:00.000Z");
            suggestion.restate({ jobId: "job-2", rationale: "다시 살펴도 멈춰 있다", observedLastEventAt: observed });
            expect(suggestion.jobId).toBe("job-2");
            expect(suggestion.rationale).toBe("다시 살펴도 멈춰 있다");
            expect(suggestion.observedLastEventAt).toEqual(observed);
        });

        it("대기 중이 아닌 제안을 고치려 하면 예외를 던진다", () => {
            const suggestion = makeSuggestion();
            suggestion.dismiss(new Date());
            expect(() =>
                suggestion.restate({ jobId: "job-2", rationale: "근거", observedLastEventAt: null }),
            ).toThrow(InvariantViolationError);
        });
    });

    describe("accept", () => {
        it("대기 중인 제안을 수락하면 accepted가 되고 resolvedAt이 채워진다", () => {
            const suggestion = makeSuggestion();
            const at = new Date("2026-01-01T00:00:00.000Z");
            suggestion.accept(at);
            expect(suggestion.status).toBe(CLEANUP_SUGGESTION_STATUS.accepted);
            expect(suggestion.resolvedAt).toEqual(at);
        });

        it("대기 중이 아닌 제안을 수락하려 하면 예외를 던진다", () => {
            const suggestion = makeSuggestion();
            suggestion.accept(new Date());
            expect(() => suggestion.accept(new Date())).toThrow(InvariantViolationError);
        });
    });

    describe("dismiss", () => {
        it("대기 중인 제안을 기각하면 dismissed가 된다", () => {
            const suggestion = makeSuggestion();
            suggestion.dismiss(new Date("2026-01-01T00:00:00.000Z"));
            expect(suggestion.status).toBe(CLEANUP_SUGGESTION_STATUS.dismissed);
        });

        it("대기 중이 아닌 제안을 기각하려 하면 예외를 던진다", () => {
            const suggestion = makeSuggestion();
            suggestion.dismiss(new Date());
            expect(() => suggestion.dismiss(new Date())).toThrow(InvariantViolationError);
        });
    });
});
