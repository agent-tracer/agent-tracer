import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { SpanTreeRow } from "~tracer-web/widgets/inspector/tabs/trace/lib/build-span-tree.js";

export type TraceRow =
  | { readonly kind: "turn"; readonly turn: TaskTurnSummary }
  | { readonly kind: "span"; readonly row: SpanTreeRow };

/** span이 시작한 시각이 어느 턴의 창에 드는지로 소속을 정한다. */
function turnAt(turns: readonly TaskTurnSummary[], atMs: number): TaskTurnSummary | undefined {
  return turns.find((turn) => {
    const startedMs = Date.parse(turn.startedAt);
    if (Number.isNaN(startedMs) || atMs < startedMs) return false;
    if (turn.endedAt === null) return true;
    return atMs <= Date.parse(turn.endedAt);
  });
}

/** 트레이스가 span만 늘어놓지 않고 턴 경계를 함께 보이도록 머리글 행을 끼운다. */
export function groupSpansByTurn(
  rows: readonly SpanTreeRow[],
  turns: readonly TaskTurnSummary[],
): readonly TraceRow[] {
  if (turns.length === 0) return rows.map((row) => ({ kind: "span", row }) as const);

  const out: TraceRow[] = [];
  let lastTurnId: string | null = null;
  for (const row of rows) {
    const turn = turnAt(turns, Date.parse(row.span.startTime));
    if (turn !== undefined && turn.id !== lastTurnId) {
      out.push({ kind: "turn", turn });
      lastTurnId = turn.id;
    }
    out.push({ kind: "span", row });
  }
  return out;
}
