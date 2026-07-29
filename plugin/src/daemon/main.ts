import {readMonitorConfigFile, resolveMonitorIdentity} from "~plugin/config/monitor.identity.js";
import {ensureAgentTracerHome, resolveAgentTracerPaths} from "~plugin/config/home.paths.js";
import {listSpoolSegments} from "~plugin/config/spool.js";
import {writeAgentTracerConfig} from "~plugin/config/config.store.js";
import {resolveDaemonSettings} from "~plugin/config/daemon.settings.js";
import {composeDaemonHooks} from "~plugin/daemon/composition.js";
import {daemonLog} from "~plugin/daemon/daemon.log.js";
import {isServerReachable} from "~plugin/daemon/delivery/ingest.retry.js";
import {buildControlSnapshot, type DaemonRuntimeState} from "~plugin/daemon/control/control.state.js";
import type {ConfigUpdateInput, ConfigUpdateResult} from "~plugin/daemon/control/control.actions.js";
import {createControlHttpHandler, type ControlActions} from "~plugin/daemon/control/control.http.js";
import {createResumeHttpHandler} from "~plugin/daemon/control/resume.http.js";
import {ensureResumeToken} from "~plugin/daemon/control/resume.token.js";
import {SpoolSender} from "~plugin/daemon/delivery/spool.sender.js";
import {createDaemonConnectionHandler} from "~plugin/daemon/ipc/socket.server.js";
import type {DaemonDeliveryResponse} from "~plugin/daemon/port/daemon.socket.port.js";
import {DaemonHealthTracker, resolveDaemonVersion} from "~plugin/daemon/lifecycle/daemon.health.js";
import {removeDaemonPid} from "~plugin/daemon/lifecycle/daemon.pid.js";
import {createDaemonServers} from "~plugin/daemon/lifecycle/servers.js";
import {EventAutomationDispatcher} from "~plugin/daemon/observation/event.automation.js";
import {InterventionLog} from "~plugin/daemon/observation/intervention.log.js";
import {SpoolHistoryObserver} from "~plugin/daemon/observation/spool.history.observer.js";
import type {GuardrailRule} from "~plugin/domain/guardrail/model/rule.model.js";
import {RecentEventRing} from "~plugin/domain/ingest/model/recent.event.model.js";
import {
    hasRunningRuleGenerationJobs,
    onRuleGenerationPoll,
    onRuleGenerationSettingRefresh,
    onUserInputForRuleGeneration,
    releaseRunningRuleGenerationJobs,
} from "~plugin/domain/rulegen/inbound/rulegen.hook.js";
import {onRulesRefresh} from "~plugin/domain/guardrail/inbound/guardrail.hook.js";

const paths = resolveAgentTracerPaths();
const version = resolveDaemonVersion();
const bootSettings = resolveDaemonSettings(process.env, paths);
const controlPort = bootSettings.controlPort;
const startedAt = Date.now();

const hooks = composeDaemonHooks(`daemon-${process.pid}`);
const ring = new RecentEventRing();
const health = new DaemonHealthTracker();
const interventions = new InterventionLog();
const automation = new EventAutomationDispatcher([
    (event) => onUserInputForRuleGeneration(hooks.rulegen, event.kind, event.taskId, event.eventId, event.prompt),
    async (event) => {
        await hooks.requestScan.execute({
            taskId: event.taskId,
            eventId: event.eventId,
            prompt: event.prompt,
        });
    },
]);
const spoolHistory = new SpoolHistoryObserver({
    paths,
    ring,
    onEvent: (event) => automation.dispatch(event),
    recordSwallowedError: () => health.recordSwallowedError(),
});

let cachedRules: readonly GuardrailRule[] = [];
let lastActivityAt = Date.now();
let activeConnections = 0;
let shuttingDown = false;
let lastHookVersion: string | null = null;
let rulesRefreshedAt: number | null = null;
let rulesFailedAt: number | null = null;

const spoolSender = new SpoolSender({
    paths,
    history: spoolHistory,
    health,
    daemonVersion: version,
    spoolMaxBytes: bootSettings.spoolMaxBytes,
    poisonAttempts: bootSettings.poisonAttempts,
    onActivity: touch,
    onOwnershipLost: () => void shutdown("ownership-lost"),
});

function applyConfigUpdate(input: ConfigUpdateInput): ConfigUpdateResult {
    writeAgentTracerConfig({userId: input.userId, baseUrl: input.baseUrl, daemon: input.daemon}, paths);
    return {
        identity: resolveMonitorIdentity(process.env, readMonitorConfigFile(paths)),
        daemon: resolveDaemonSettings(process.env, paths),
    };
}

function touch(): void {
    lastActivityAt = Date.now();
}

async function refreshRules(): Promise<void> {
    const rules = await onRulesRefresh(hooks.guardrail);
    if (rules === null) {
        rulesFailedAt = Date.now();
        health.recordSwallowedError();
        return;
    }
    cachedRules = rules;
    rulesRefreshedAt = Date.now();
}

async function refreshRuleSetting(): Promise<void> {
    await onRuleGenerationSettingRefresh(hooks.rulegen);
}

function currentState(): DaemonRuntimeState {
    return {
        ...spoolSender.state(),
        version,
        hookVersion: lastHookVersion,
        pid: process.pid,
        startedAt,
        entryPath: process.argv[1] ?? "unknown",
        identity: resolveMonitorIdentity(),
        activeConnections,
        lastActivityAt,
        idleShutdownMs: bootSettings.idleShutdownMs,
        swallowedErrors: health.swallowedErrorCount,
        rules: cachedRules,
        caches: {
            rules: {
                lastRefreshAt: rulesRefreshedAt,
                lastFailureAt: rulesFailedAt,
                intervalMs: bootSettings.rulesRefreshMs,
                entries: cachedRules.length,
            },
        },
        ring: ring.stats(),
        interventions: interventions.snapshot(),
        settings: bootSettings,
    };
}

function currentDelivery(): DaemonDeliveryResponse {
    return {
        reachable: isServerReachable(spoolSender.state().lastSendOutcome),
        baseUrl: resolveMonitorIdentity().baseUrl,
        backlogBytes: listSpoolSegments(paths).reduce((total, segment) => total + segment.size, 0),
    };
}

async function shutdown(reason: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    spoolSender.stop();
    daemonLog(`${reason} — final flush`);
    servers.close();
    await releaseRunningRuleGenerationJobs(hooks.rulegen);
    await spoolSender.finalFlush();
    removeDaemonPid(paths);
    process.exit(0);
}

function refreshAll(): void {
    void refreshRules();
    void refreshRuleSetting();
}

const controlActions: ControlActions = {
    snapshot: () => buildControlSnapshot(currentState(), paths),
    flush: () => spoolSender.flushNow(),
    resetBackoff: () => spoolSender.resetBackoff(),
    refreshCaches: refreshAll,
    restart: () => void shutdown("control-restart"),
    stop: () => void shutdown("control-stop"),
    updateConfig: applyConfigUpdate,
};

ensureAgentTracerHome(paths);
const controlToken = ensureResumeToken(paths);
const servers = createDaemonServers({
    paths,
    controlPort,
    rebindRetryMs: bootSettings.controlRebindRetryMs,
    onConnection: createDaemonConnectionHandler({
        version,
        ring,
        interventions,
        guardrail: hooks.guardrail,
        hint: hooks.hint,
        readRules: () => cachedRules,
        readDelivery: currentDelivery,
        refreshHistory: () => spoolSender.feedHistory(),
        onHookVersion: (hookVersion) => {
            lastHookVersion = hookVersion;
        },
        onActivity: touch,
        onConnectionOpened: () => {
            activeConnections += 1;
        },
        onConnectionClosed: () => {
            activeConnections = Math.max(0, activeConnections - 1);
        },
        recordSwallowedError: () => health.recordSwallowedError(),
        shutdown: (reason) => void shutdown(reason),
    }),
    resumeHandler: createResumeHttpHandler(controlToken),
    controlHandler: createControlHttpHandler({token: controlToken, actions: controlActions, paths}),
    onActivity: touch,
    onSocketReady: () => {
        refreshAll();
        void onRuleGenerationPoll(hooks.rulegen);
        spoolSender.start();
    },
    isShuttingDown: () => shuttingDown,
});

servers.start();

const timers = [
    setInterval(() => {
        if (shuttingDown) return;
        void refreshRules();
        void refreshRuleSetting();
    }, bootSettings.rulesRefreshMs),
    setInterval(() => {
        if (!shuttingDown) void onRuleGenerationPoll(hooks.rulegen);
    }, bootSettings.ruleGenPollMs),
    setInterval(() => {
        if (shuttingDown) return;
        if (
            spoolSender.hasPendingSegments()
            || activeConnections > 0
            || spoolSender.isBackingOff()
            || hasRunningRuleGenerationJobs(hooks.rulegen)
        ) {
            touch();
            return;
        }
        if (Date.now() - lastActivityAt < bootSettings.idleShutdownMs) return;
        daemonLog(`idle ${bootSettings.idleShutdownMs}ms — exiting`);
        void shutdown("idle-timeout");
    }, bootSettings.idleCheckMs),
];
for (const timer of timers) timer.unref();

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
