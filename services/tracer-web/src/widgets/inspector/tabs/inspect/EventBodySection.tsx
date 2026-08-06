import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import { splitBodySegments } from "~tracer-web/widgets/inspector/lib/event-body.js";

interface EventBodySectionProps {
  readonly event: TimelineEventRecord;
}

/** 코드 펜스를 인식해 `event.body`를 렌더링한다. */
export function EventBodySection({ event }: EventBodySectionProps) {
  if (!event.body) return null;
  const segments = splitBodySegments(event.body);
  if (segments.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {segments.map((segment, idx) =>
        segment.kind === "code" ? (
          <pre
            key={idx}
            className="rounded-sm m-0 px-3 py-2 overflow-x-auto bg-canvas border border-hair font-mono text-meta text-ink leading-normal whitespace-pre"
          >
            {segment.lang && (
              <div className="text-micro text-ink-tertiary tracking-label uppercase mb-1.5">
                {segment.lang}
              </div>
            )}
            {segment.text}
          </pre>
        ) : (
          <p
            key={idx}
            className="m-0 text-body text-ink-muted leading-normal whitespace-pre-wrap break-words"
          >
            {segment.text}
          </p>
        ),
      )}
    </div>
  );
}
