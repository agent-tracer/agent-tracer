import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import { eventToKvPairs } from "~tracer-web/widgets/inspector/lib/event-to-kv.js";

interface EventKvGridProps {
  readonly event: TimelineEventRecord;
}

/** 2컬럼 key/value 그리드(거터 약 78px). key는 모노스페이스 tertiary 색으로, value는 모노스페이스 muted 색으로 렌더링한다. */
export function EventKvGrid({ event }: EventKvGridProps) {
  const pairs = eventToKvPairs(event);
  if (pairs.length === 0) return null;

  return (
    <dl
      className="mt-3 grid gap-y-1.5 gap-x-3 text-body"
      style={{ gridTemplateColumns: "78px 1fr" }}
    >
      {pairs.map((pair) => (
        <KvRow key={pair.key} pair={pair} />
      ))}
    </dl>
  );
}

function KvRow({ pair }: { pair: { key: string; value: string } }) {
  return (
    <>
      <dt className="font-mono text-mini tracking-label text-ink-tertiary pt-px">
        {pair.key}
      </dt>
      <dd className="m-0 font-mono text-meta text-ink-muted break-all">
        {pair.value}
      </dd>
    </>
  );
}
