import {HttpAgentBackend, preferredAgentBackend} from "~plugin/config/agent.backend.js";
import {monitorUserHeaders, resolveMonitorIdentity} from "~plugin/config/monitor.identity.js";
import {EvaluateTurnUsecase} from "~plugin/domain/guardrail/application/evaluate.turn.usecase.js";
import {RefreshRulesUsecase} from "~plugin/domain/guardrail/application/refresh.rules.usecase.js";
import {HttpRuleSourceAdapter} from "~plugin/domain/guardrail/adapter/http.rule.source.adapter.js";
import type {GuardrailHook} from "~plugin/domain/guardrail/inbound/guardrail.hook.js";
import {ComputeHintsUsecase} from "~plugin/domain/hint/application/compute.hints.usecase.js";
import type {HintHook} from "~plugin/domain/hint/inbound/hint.hook.js";
import {HttpRecipeScanJobAdapter} from "~plugin/domain/recipe/adapter/http.recipe.scan.job.adapter.js";
import {RequestRecipeScanUsecase} from "~plugin/domain/recipe/application/request.recipe.scan.usecase.js";
import {AgentRuleGeneratorAdapter} from "~plugin/domain/rulegen/adapter/agent.rule.generator.adapter.js";
import {ClaudeRuleAgentRunnerAdapter} from "~plugin/domain/rulegen/adapter/claude.rule.agent.runner.adapter.js";
import {HttpRuleEvidenceAdapter} from "~plugin/domain/rulegen/adapter/http.rule.evidence.adapter.js";
import {StderrRulegenLogAdapter} from "~plugin/domain/rulegen/adapter/stderr.rulegen.log.adapter.js";
import {TracerRuleGenerationAdapter} from "~plugin/domain/rulegen/adapter/tracer.rule.generation.adapter.js";
import {TracerRuleSettingAdapter} from "~plugin/domain/rulegen/adapter/tracer.rule.setting.adapter.js";
import {RequestRuleGenerationUsecase} from "~plugin/domain/rulegen/application/request.rule.generation.usecase.js";
import {PollRuleGenerationsUsecase} from "~plugin/domain/rulegen/application/poll.rule.generations.usecase.js";
import {RefreshRuleSettingUsecase} from "~plugin/domain/rulegen/application/refresh.rule.setting.usecase.js";
import {RunRuleGenerationUsecase} from "~plugin/domain/rulegen/application/run.rule.generation.usecase.js";
import type {RulegenHook} from "~plugin/domain/rulegen/inbound/rulegen.hook.js";
import {RuleGenerationSettingCache} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {SchedulerPort} from "~plugin/domain/rulegen/port/scheduler.port.js";

/** 데몬이 부르는 도메인 진입점 묶음 전체다. */
export interface DaemonHooks {
    readonly guardrail: GuardrailHook;
    readonly hint: HintHook;
    /** 스풀에서 관찰한 사용자 발화가 /recipe 명령이면 스캔을 큐잉하는 자체 자동화 전용이다. */
    readonly requestScan: RequestRecipeScanUsecase;
    readonly rulegen: RulegenHook;
}

/** 데몬 프로세스가 쓰는 어댑터와 유스케이스를 한 곳에서 조립한다. */
export function composeDaemonHooks(leaseOwner: string): DaemonHooks {
    const identity = resolveMonitorIdentity();
    const baseUrl = identity.baseUrl;
    const headers = monitorUserHeaders(identity);

    // 상류가 둘 이상인 배포에서는 축을 지목하지 않은 에이전트 요청을 게이트웨이가 400으로 거절한다.
    const agentBackend = new HttpAgentBackend(baseUrl, headers, preferredAgentBackend());

    const clock = {now: (): number => Date.now()};
    const scheduler: SchedulerPort = {
        every: (intervalMs, run) => {
            const timer = setInterval(run, intervalMs);
            // 하트비트가 프로세스 종료를 막지 않게 한다.
            timer.unref();
            return () => clearInterval(timer);
        },
    };

    const ruleSource = new HttpRuleSourceAdapter(baseUrl, headers);
    const guardrail: GuardrailHook = {
        evaluateTurn: new EvaluateTurnUsecase(ruleSource),
        refreshRules: new RefreshRulesUsecase(ruleSource),
    };

    const hint: HintHook = {computeHints: new ComputeHintsUsecase(clock)};

    const requestScan = new RequestRecipeScanUsecase(new HttpRecipeScanJobAdapter(baseUrl, headers, agentBackend));

    const rulegenLog = new StderrRulegenLogAdapter();
    const jobs = new TracerRuleGenerationAdapter(baseUrl, headers, leaseOwner, rulegenLog);
    const runRuleJob = new RunRuleGenerationUsecase(
        new HttpRuleEvidenceAdapter(baseUrl, headers),
        new AgentRuleGeneratorAdapter(new ClaudeRuleAgentRunnerAdapter()),
        jobs,
        clock,
        rulegenLog,
    );
    const ruleSettingCache = new RuleGenerationSettingCache();
    const rulegen: RulegenHook = {
        pollGenerations: new PollRuleGenerationsUsecase(
            jobs,
            (request, signal) => runRuleJob.execute(request, signal),
            scheduler,
            ruleSettingCache,
            rulegenLog,
        ),
        refreshSetting: new RefreshRuleSettingUsecase(
            new TracerRuleSettingAdapter(baseUrl, headers),
            ruleSettingCache,
        ),
        requestGeneration: new RequestRuleGenerationUsecase(jobs, ruleSettingCache, rulegenLog),
    };

    return {
        guardrail,
        hint,
        requestScan,
        rulegen,
    };
}
