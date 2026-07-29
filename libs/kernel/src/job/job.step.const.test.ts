import { describe, expect, it } from "vitest";
import {
    AI_JOB_STEP_ROLE,
    AI_JOB_STEP_ROLES,
    type AiJobStepList,
} from "./job.step.const.js";

// 계약은 배포 단위가 아니라 submodule 이므로 별칭 표에 자리가 없고 로더를 파일 위치로 찾는다.
const contractModuleUrl = new URL(
    "../../../../contract/conformance/runner/contract.mjs",
    import.meta.url,
);
const { readShared } = (await import(contractModuleUrl.href)) as {
    readonly readShared: (fileName: string) => unknown;
};

describe("AiJobStep 계약", () => {
    it("잡 step 읽기 계약은 순서 있는 payload 배열이다", () => {
        const steps = [
            {
                seq: 0,
                attempt: 1,
                role: AI_JOB_STEP_ROLE.user,
                content: "Search recipes",
                truncated: false,
                toolCalls: [],
            },
            {
                seq: 1,
                attempt: 1,
                role: AI_JOB_STEP_ROLE.assistant,
                content: "Calling search_recipes",
                truncated: false,
                toolCalls: [{ id: "tool-1", name: "search_recipes", args: { query: "ramen" } }],
            },
            {
                seq: 2,
                attempt: 2,
                role: AI_JOB_STEP_ROLE.graph,
                content: "증거 충분성 판정을 마쳤다.",
                truncated: false,
                toolCalls: [],
                nodeName: "assess_evidence",
                durationMs: 14,
            },
        ] satisfies AiJobStepList;

        expect(steps[0]?.seq).toBe(0);
        expect(steps[1]?.toolCalls[0]?.name).toBe("search_recipes");
        expect(steps[2]?.attempt).toBe(2);
    });

    it("잡 step 역할은 계약의 역할과 순서까지 일치한다", () => {
        const vocabulary = readShared("execution.vocabulary.json") as {
            readonly stepRoles: readonly string[];
        };

        expect(AI_JOB_STEP_ROLES).toEqual(vocabulary.stepRoles);
    });
});
