import type { ReactNode } from "react";
import { isDaemonHealthStale } from "~tracer-web/entities/daemon/model/daemon-health.js";
import { formatBytes } from "~tracer-web/shared/lib/formatting/format-bytes.js";
import { formatAbsoluteHHmmss, formatRelativeShort } from "~tracer-web/shared/lib/formatting/time.js";
import { useNowMs } from "~tracer-web/shared/lib/hooks/use-now-ms.js";
import { useDaemonHealthQuery } from "~tracer-web/entities/daemon/api/queries.js";
import { resolveDaemonControlPageUrl } from "~tracer-web/shared/config/daemon-base-url.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Card, ExternalLinkIcon, GuidanceText, Pill, SectionHeading, Tooltip } from "~tracer-web/shared/ui/index.js";

/** 로컬 수집 데몬의 연결·스풀·재시작 상태를 표시한다. */
export function DaemonHealthSection() {
  const { data } = useDaemonHealthQuery();
  const nowMs = useNowMs(15_000);
  const snapshot = data?.snapshot ?? null;
  const reachable = snapshot !== null && !isDaemonHealthStale(snapshot.reportedAt, nowMs);

  return (
    <Card surface="canvas" className="py-5 px-6">
      <SectionHeading action={<ControlPageLink reachable={reachable} />}>
        Collector health
      </SectionHeading>
      {!snapshot ? (
        <p className="text-ink-muted text-lead">No health report received yet.</p>
      ) : (
        <div className="flex flex-col gap-2 mt-1">
          <Row label="Spool backlog" value={formatBytes(snapshot.spoolBacklogBytes)} />
          <Row
            label="Dead-letter"
            value={
              snapshot.lastDeadReasons.length > 0 ? (
                <Tooltip content={snapshot.lastDeadReasons.join("; ")} side="left">
                  <span>{snapshot.deadLetterCount}</span>
                </Tooltip>
              ) : (
                `${snapshot.deadLetterCount}`
              )
            }
          />
          <Row label="Swallowed errors" value={`${snapshot.swallowedErrors}`} />
          <Row label="Daemon version" value={snapshot.daemonVersion} />
          <Row
            label="Last reported"
            value={
              <span className="flex items-center gap-2">
                <Tooltip content={formatAbsoluteHHmmss(snapshot.reportedAt)} side="left">
                  <span>{formatRelativeShort(snapshot.reportedAt, nowMs)} ago</span>
                </Tooltip>
                {isDaemonHealthStale(snapshot.reportedAt, nowMs) ? (
                  <Pill tone="warn" dot>stale</Pill>
                ) : (
                  <Pill tone="ok" dot>live</Pill>
                )}
              </span>
            }
          />
        </div>
      )}
    </Card>
  );
}

/** 데몬과 같은 기계에서만 열리는, 데몬이 스스로 서빙하는 제어 화면으로 나가는 링크다. */
function ControlPageLink({ reachable }: { readonly reachable: boolean }) {
  const guidance = useGuidance();
  const label = "Open control page";
  const className =
    "inline-flex items-center gap-1.5 text-body font-medium no-underline rounded-sm px-2 h-7";

  if (!reachable) {
    return (
      <Tooltip
        content={
          <GuidanceText
            locale={guidance.locale}
            message={guidance.messages.settings.daemonUnreachable}
          />
        }
        side="left"
      >
        <span aria-disabled className={`${className} text-ink-tertiary cursor-not-allowed`}>
          <ExternalLinkIcon />
          {label}
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={
        <GuidanceText
          locale={guidance.locale}
          message={guidance.messages.settings.daemonControls}
        />
      }
      side="left"
    >
      <a
        href={resolveDaemonControlPageUrl()}
        target="_blank"
        rel="noreferrer"
        className={`${className} text-ink-muted hover:bg-s1 hover:text-ink transition-colors`}
      >
        <ExternalLinkIcon />
        {label}
      </a>
    </Tooltip>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-body">
      <span className="text-ink-tertiary">{label}</span>
      <span className="text-ink font-mono">{value}</span>
    </div>
  );
}
