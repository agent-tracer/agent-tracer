import {RULE_GENERATION_FOCUS} from "@agent-tracer/kernel/job/job.const.js";
import {afterEach, describe, expect, it, vi} from "vitest";
import {PollRuleJobsUsecase} from "~plugin/domain/rulegen/application/poll.rule.jobs.usecase.js";
import type {PendingRuleJob, RuleJobRunner} from "~plugin/domain/rulegen/model/rule.job.model.js";
import type {RuleGenerationRequest} from "~plugin/domain/rulegen/model/rulegen.spec.model.js";
import {InMemoryRuleJob} from "~plugin/domain/rulegen/port/__fakes__/in-memory.rule.job.js";
import {ManualScheduler} from "~plugin/domain/rulegen/port/__fakes__/manual.scheduler.js";
import {RuleGenerationSettingCache} from "~plugin/domain/rulegen/model/rule.command.model.js";

function settingCache(model: string | null = null): RuleGenerationSettingCache {
    const cache = new RuleGenerationSettingCache();
    cache.replace({maxRulesPerTask: 2, model});
    return cache;
}

interface RunnerSpy {
    readonly runner: RuleJobRunner;
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

function jobWith(input: NonNullable<PendingRuleJob["input"]>): PendingRuleJob {
    return {id: "job-1", taskId: "task-1", input: {anchorEventId: "evt-1", ...input}};
}

function withWorkspace(jobs: InMemoryRuleJob): InMemoryRuleJob {
    jobs.workspaces.set("task-1", "/tmp/workspace");
    jobs.anchors.set("evt-1", "기본 요구");
    return jobs;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("PollRuleJobsUsecase", () => {
    it("설정 창구가 없는 배포에서는 잡을 집어 가지 않는다", async () => {
        const jobs = withWorkspace(new InMemoryRuleJob([jobWith({})]));
        const spy = spyRunner();
        const cache = settingCache();
        cache.markUnsupported();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), cache).execute();

        expect(jobs.claimed).toEqual([]);
        expect(spy.requests).toEqual([]);
    });

    it("pending 잡을 클레임한 뒤 입력의 초점과 규칙 상한을 실행기에 넘긴다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([
            jobWith({focus: RULE_GENERATION_FOCUS.recent, maxRules: 2}),
        ]));
        const spy = spyRunner();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache()).execute();

        expect(jobs.claimed).toEqual(["job-1"]);
        expect(spy.requests[0]).toEqual({
            jobId: "job-1",
            taskId: "task-1",
            workspacePath: "/tmp/workspace",
            focus: RULE_GENERATION_FOCUS.recent,
            maxRules: 2,
            anchorText: "기본 요구",
        });
    });

    it("사용자가 설정한 모델로 로컬 규칙 생성기를 돌린다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([jobWith({})]));
        const spy = spyRunner();

        await new PollRuleJobsUsecase(
            jobs, spy.runner, new ManualScheduler(), settingCache("claude-opus-5"),
        ).execute();

        expect(spy.requests[0]?.model).toBe("claude-opus-5");
    });

    it("설정한 모델이 없으면 실행 인자에서 뺀다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([jobWith({})]));
        const spy = spyRunner();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache()).execute();

        expect(spy.requests[0]).not.toHaveProperty("model");
    });

    it("앵커 이벤트가 있으면 그 사용자 입력 원문을 실행기에 실어 보낸다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([jobWith({anchorEventId: "evt-1"})]));
        jobs.anchors.set("evt-1", "린트를 돌려줘");
        const spy = spyRunner();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache()).execute();

        expect(spy.requests[0]?.anchorText).toBe("린트를 돌려줘");
    });

    it("공백뿐인 의도는 실행 입력에서 뺀다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([jobWith({intent: "   "})]));
        const spy = spyRunner();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache()).execute();

        expect(spy.requests[0]).not.toHaveProperty("intent");
    });

    it("anchor가 없거나 소유 사용자 발화로 확인되지 않으면 유료 실행 전에 실패시킨다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([
            {id: "job-1", taskId: "task-1", input: {}},
            {id: "job-2", taskId: "task-1", input: {anchorEventId: "missing"}},
        ]));
        const spy = spyRunner();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache()).execute();

        expect(jobs.claimed).toEqual([]);
        expect(jobs.failed).toEqual([
            {jobId: "job-1", error: "rule generation job has no anchor event"},
            {jobId: "job-2", error: "anchor missing is not an owned user message"},
        ]);
        expect(spy.requests).toEqual([]);
    });

    it("워크스페이스가 없는 잡은 클레임하지 않고 실패로 종결시킨다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = new InMemoryRuleJob([jobWith({})]);
        const spy = spyRunner();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache()).execute();

        expect(jobs.claimed).toEqual([]);
        expect(jobs.failed).toEqual([{jobId: "job-1", error: "task task-1 has no workspacePath"}]);
        expect(spy.requests).toEqual([]);
    });

    it("클레임에 실패하면 실행기를 부르지 않는다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([jobWith({})]));
        jobs.claimable = false;
        const spy = spyRunner();

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache()).execute();

        expect(spy.requests).toEqual([]);
    });

    it("동시 실행 상한을 넘는 잡은 이번 회차에 집지 않는다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = new InMemoryRuleJob([
            {id: "job-1", taskId: "task-1", input: {anchorEventId: "evt-1"}},
            {id: "job-2", taskId: "task-1", input: {anchorEventId: "evt-1"}},
        ]);
        jobs.workspaces.set("task-1", "/tmp/workspace");
        jobs.anchors.set("evt-1", "기본 요구");
        const spy = spyRunner((signal) => new Promise((resolve) => signal.addEventListener("abort", () => resolve())));

        await new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache(), 1).execute();

        expect(jobs.claimed).toEqual(["job-1"]);
    });

    it("데몬이 내려가면 실행을 끊고 잡을 대기로 반납한다", async () => {
        vi.spyOn(process.stderr, "write").mockReturnValue(true);
        const jobs = withWorkspace(new InMemoryRuleJob([jobWith({})]));
        const spy = spyRunner((signal) => new Promise((resolve) => signal.addEventListener("abort", () => resolve())));
        const usecase = new PollRuleJobsUsecase(jobs, spy.runner, new ManualScheduler(), settingCache());

        await usecase.execute();
        expect(usecase.hasRunning()).toBe(true);

        await usecase.releaseRunning();

        expect(spy.signals[0]?.aborted).toBe(true);
        expect(jobs.released).toEqual(["job-1"]);
        expect(usecase.hasRunning()).toBe(false);
    });
});
