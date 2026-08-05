import {afterEach, describe, expect, it, vi} from "vitest";
import {PollRuleGenerationsUsecase} from "~plugin/domain/rulegen/application/poll.rule.generations.usecase.js";
import {RuleGenerationSettingCache} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {PendingRuleGeneration, RuleGenerationRunner} from "~plugin/domain/rulegen/model/rule.generation.model.js";
import type {RuleGenerationRequest} from "~plugin/domain/rulegen/model/rulegen.spec.model.js";
import {InMemoryRuleGeneration} from "~plugin/domain/rulegen/port/__fakes__/in-memory.rule.generation.js";
import {ManualScheduler} from "~plugin/domain/rulegen/port/__fakes__/manual.scheduler.js";
import {RecordingRulegenLog} from "~plugin/domain/rulegen/port/__fakes__/recording.rulegen.log.js";

function settingCache(model = "claude-sonnet-5"): RuleGenerationSettingCache {
    const cache = new RuleGenerationSettingCache();
    cache.replace({maxRulesPerTask: 2, model, outputLanguage: "ko", effort: "xhigh"});
    return cache;
}

interface RunnerSpy {
    readonly runner: RuleGenerationRunner;
    readonly requests: RuleGenerationRequest[];
    readonly signals: AbortSignal[];
}

function spyRunner(body: (signal: AbortSignal) => Promise<void> = () => Promise.resolve()): RunnerSpy {
    const requests: RuleGenerationRequest[] = [];
    const signals: AbortSignal[] = [];
    return {
        requests,
        signals,
        runner: (request, signal) => {
            requests.push(request);
            signals.push(signal);
            return body(signal);
        },
    };
}

function pending(overrides: Partial<PendingRuleGeneration> = {}): PendingRuleGeneration {
    return {id: "gen-1", taskId: "task-1", anchorEventId: "evt-1", ...overrides};
}

function ready(jobs: InMemoryRuleGeneration): InMemoryRuleGeneration {
    jobs.workspaces.set("task-1", "/tmp/workspace");
    jobs.anchors.set("evt-1", {text: "/rule 린트를 돌려줘", turnId: "turn-1"});
    return jobs;
}

function poll(
    jobs: InMemoryRuleGeneration,
    spy: RunnerSpy,
    cache: RuleGenerationSettingCache = settingCache(),
    maxConcurrent = 2,
): PollRuleGenerationsUsecase {
    return new PollRuleGenerationsUsecase(
        jobs,
        spy.runner,
        new ManualScheduler(),
        cache,
        new RecordingRulegenLog(),
        maxConcurrent,
    );
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("PollRuleGenerationsUsecase", () => {
    it("설정 창구가 없는 배포에서는 요청을 집어 가지 않는다", async () => {
        const jobs = ready(new InMemoryRuleGeneration([pending()]));
        const spy = spyRunner();
        const cache = settingCache();
        cache.markUnsupported();

        await poll(jobs, spy, cache).execute();

        expect(jobs.claimed).toEqual([]);
        expect(spy.requests).toEqual([]);
    });

    it("대기 요청을 클레임하고 앵커와 설정을 실행기에 넘긴다", async () => {
        const jobs = ready(new InMemoryRuleGeneration([pending({maxRules: 1, intent: "테스트를 먼저 쓴다"})]));
        const spy = spyRunner();

        await poll(jobs, spy).execute();

        expect(jobs.claimed).toEqual(["gen-1"]);
        expect(spy.requests[0]).toEqual({
            requestId: "gen-1",
            taskId: "task-1",
            workspacePath: "/tmp/workspace",
            maxRules: 1,
            intent: "테스트를 먼저 쓴다",
            anchorTurnId: "turn-1",
            anchorEventId: "evt-1",
            anchorText: "린트를 돌려줘",
            model: "claude-sonnet-5",
            language: "ko",
            effort: "xhigh",
        });
    });

    it("클레임하지 못하면 왕복도 실행도 하지 않는다", async () => {
        const jobs = ready(new InMemoryRuleGeneration([pending()]));
        jobs.claimable = false;
        const spy = spyRunner();

        await poll(jobs, spy).execute();

        expect(spy.requests).toEqual([]);
        expect(jobs.failures).toEqual([]);
    });

    it("앵커 이벤트가 없는 요청은 실행 없이 실패로 종결한다", async () => {
        const jobs = ready(new InMemoryRuleGeneration([pending({anchorEventId: null})]));
        const spy = spyRunner();

        await poll(jobs, spy).execute();

        expect(spy.requests).toEqual([]);
        expect(jobs.failures[0]?.failure.error).toContain("no anchor event");
    });

    it("워크스페이스를 모르는 태스크는 실패로 종결한다", async () => {
        const jobs = new InMemoryRuleGeneration([pending()]);
        jobs.anchors.set("evt-1", {text: "린트를 돌려줘", turnId: "turn-1"});
        const spy = spyRunner();

        await poll(jobs, spy).execute();

        expect(spy.requests).toEqual([]);
        expect(jobs.failures[0]?.failure.error).toContain("workspacePath");
    });

    it("앵커가 이 사용자의 발화가 아니면 실패로 종결한다", async () => {
        const jobs = new InMemoryRuleGeneration([pending()]);
        jobs.workspaces.set("task-1", "/tmp/workspace");
        const spy = spyRunner();

        await poll(jobs, spy).execute();

        expect(jobs.failures[0]?.failure.error).toContain("not an owned user message");
    });

    it("동시 실행 상한을 넘겨 집지 않는다", async () => {
        const jobs = ready(new InMemoryRuleGeneration([pending(), pending({id: "gen-2"})]));
        const spy = spyRunner((signal) => new Promise((resolve) => signal.addEventListener("abort", () => resolve())));

        await poll(jobs, spy, settingCache(), 1).execute();

        expect(jobs.claimed).toEqual(["gen-1"]);
    });

    it("데몬이 내려가면 쥔 요청을 서버에 반납한다", async () => {
        const jobs = ready(new InMemoryRuleGeneration([pending()]));
        const spy = spyRunner((signal) => new Promise((resolve) => signal.addEventListener("abort", () => resolve())));
        const usecase = poll(jobs, spy);
        await usecase.execute();

        await usecase.releaseRunning();

        expect(jobs.released).toEqual(["gen-1"]);
        expect(usecase.hasRunning()).toBe(false);
    });
});
