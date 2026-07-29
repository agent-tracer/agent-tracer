import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { tracerViewNames } from "./tracer.table.catalog.js";

describe("tracerViewNames", () => {
    it("에이전트 실행 백엔드가 읽는 계약 뷰가 권한 대상 목록에 있다", () => {
        expect(tracerViewNames()).toEqual(expect.arrayContaining([
            "agent_task_view", "agent_turn_view", "agent_event_view", "agent_rule_view",
        ]));
    });
});
