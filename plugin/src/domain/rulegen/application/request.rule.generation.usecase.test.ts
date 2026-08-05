import {KIND} from "@agent-tracer/kernel/ingest/event.kind.const.js";
import {RecordingRulegenLog} from "~plugin/domain/rulegen/port/__fakes__/recording.rulegen.log.js";
import {describe, expect, it} from "vitest";
import {RequestRuleGenerationUsecase} from "~plugin/domain/rulegen/application/request.rule.generation.usecase.js";
import {RuleGenerationSettingCache} from "~plugin/domain/rulegen/model/rule.command.model.js";
import {InMemoryRuleGeneration} from "~plugin/domain/rulegen/port/__fakes__/in-memory.rule.generation.js";

function cacheWith(maxRulesPerTask = 2): RuleGenerationSettingCache {
    const cache = new RuleGenerationSettingCache();
    cache.replace({maxRulesPerTask, model: "claude-sonnet-5", outputLanguage: "auto", effort: "high"});
    return cache;
}

describe("RequestRuleGenerationUsecase", () => {
    it("요구가 담긴 규칙 명령이면 앵커 이벤트로 잡을 넣는다", async () => {
        const jobs = new InMemoryRuleGeneration();

        await new RequestRuleGenerationUsecase(jobs, cacheWith(3), new RecordingRulegenLog())
            .execute(KIND.userMessage, "t1", "e1", "/rule 이번 턴에서 규칙을 뽑아줘");

        expect(jobs.enqueued).toEqual([{taskId: "t1", anchorEventId: "e1", maxRules: 3}]);
    });

    it("설정 창구가 없는 배포에서는 잡을 넣지 않는다", async () => {
        const jobs = new InMemoryRuleGeneration();
        const cache = cacheWith(3);
        cache.markUnsupported();

        await new RequestRuleGenerationUsecase(jobs, cache, new RecordingRulegenLog())
            .execute(KIND.userMessage, "t1", "e1", "/rule 이번 턴에서 규칙을 뽑아줘");

        expect(jobs.enqueued).toEqual([]);
    });

    it("플러그인 네임스페이스가 붙은 호출도 규칙 명령으로 본다", async () => {
        const jobs = new InMemoryRuleGeneration();

        await new RequestRuleGenerationUsecase(jobs, cacheWith(), new RecordingRulegenLog())
            .execute(KIND.userMessage, "t1", "e1", "/agent-tracer-monitor:rule @README.md 확인해줘");

        expect(jobs.enqueued).toHaveLength(1);
    });

    it("검증할 요구가 없는 맨 명령은 잡을 넣지 않는다", async () => {
        const jobs = new InMemoryRuleGeneration();

        await new RequestRuleGenerationUsecase(jobs, cacheWith(), new RecordingRulegenLog())
            .execute(KIND.userMessage, "t1", "e1", "/rule");

        expect(jobs.enqueued).toEqual([]);
    });

    it("규칙 명령이 아닌 사용자 입력은 잡을 넣지 않는다", async () => {
        const jobs = new InMemoryRuleGeneration();

        await new RequestRuleGenerationUsecase(jobs, cacheWith(), new RecordingRulegenLog())
            .execute(KIND.userMessage, "t1", "e1", "일반 요청입니다");

        expect(jobs.enqueued).toEqual([]);
    });

    it("사용자 입력이 아닌 이벤트는 잡을 넣지 않는다", async () => {
        const jobs = new InMemoryRuleGeneration();

        await new RequestRuleGenerationUsecase(jobs, cacheWith(), new RecordingRulegenLog())
            .execute(KIND.assistantResponse, "t1", "e1", "/rule 테스트 돌려줘");

        expect(jobs.enqueued).toEqual([]);
    });

    it("태스크에 진행 중인 잡이 있으면 새로 넣지 않는다", async () => {
        const jobs = new InMemoryRuleGeneration();
        jobs.activeJob = true;

        await new RequestRuleGenerationUsecase(jobs, cacheWith(), new RecordingRulegenLog())
            .execute(KIND.userMessage, "t1", "e1", "/rule 테스트 돌려줘");

        expect(jobs.enqueued).toEqual([]);
    });
});
