import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import { formatHHmmss, formatOffset } from "~tracer-web/shared/lib/formatting/time.js";
import { laneThemeForEvent, type LaneTheme } from "~tracer-web/entities/task/model/lane-theme.js";
import {
  extractPaths,
  extractTokens,
  type TokensVm,
} from "~tracer-web/widgets/feed/lib/extraction/extract-metadata.js";

/** act 카드 하나를 위한 렌더링용 뷰모델. */
export interface ActVm {
  readonly event: TimelineEventRecord;
  readonly lane: LaneTheme;
  readonly clockLabel: string;
  readonly offsetLabel: string;
  readonly toolName: string;
  /**
   * 백엔드가 제공하는 세분화 라벨(read_file / run_test / apply_patch...).
   * 의미 분류기가 돌지 않았거나 라벨이 toolName과 중복되면 null이다
   * (같은 문자열을 두 번 렌더링하지 않는다).
   */
  readonly subtypeLabel: string | null;
  /**
   * 카드 본문이며 제목이 이미 말한 부분은 빠진다.
   */
  readonly bodyText: string | null;
  readonly hasViolation: boolean;
  readonly paths: readonly string[];
  readonly tokens: TokensVm | null;
}

export function classifyEvent(event: TimelineEventRecord, baseMs: number): ActVm {
  const eventMs = Date.parse(event.createdAt);
  const subtypeLabel = pickSubtypeLabel(event);
  return {
    event,
    lane: laneThemeForEvent(event),
    clockLabel: formatHHmmss(eventMs),
    offsetLabel: formatOffset(eventMs, baseMs),
    toolName: event.title,
    subtypeLabel,
    bodyText: pickBodyText(event),
    hasViolation: detectViolation(event),
    paths: extractPaths(event),
    tokens: extractTokens(event),
  };
}

/** 보수적인 휴리스틱이다. */
function detectViolation(event: TimelineEventRecord): boolean {
  const tags = event.classification.tags;
  return tags.includes("violation");
}

/** 제목이 이미 보여 준 앞부분을 본문에서 덜어내 같은 글이 두 번 쌓이지 않게 한다. */
export function pickBodyText(event: TimelineEventRecord): string | null {
  const body = event.body?.trim();
  if (!body) return null;

  const title = event.title.trim();
  if (!title) return body;
  if (body === title) return null;
  if (!body.startsWith(title)) return body;

  const rest = body.slice(title.length).trim();
  return rest.length > 0 ? rest : null;
}

/** subtypeLabel이 title과 중복되면 숨긴다. */
function pickSubtypeLabel(event: TimelineEventRecord): string | null {
  const label = event.semantic?.subtypeLabel.trim();
  if (!label) return null;
  const title = event.title.toLowerCase();
  return title.includes(label.toLowerCase()) ? null : label;
}
