import {KIND} from "~plugin/domain/ingest/model/event.model.js";
import type {RecentEvent} from "~plugin/domain/ingest/model/recent.event.model.js";
import type {PreprocessingHint} from "~plugin/domain/hint/model/hint.model.js";

/** 이만큼 턴이 쌓이기 전에는 작업이 바뀌었다고 볼 근거가 모자란다. */
const MIN_TURNS = 3;
/** 겹침을 볼 직전 턴 수이며, 넓히면 이미 끝난 작업까지 섞여 감지가 무뎌진다. */
const LOOKBACK_TURNS = 2;
/** 마커를 한 번 남긴 뒤 이만큼 턴이 지나야 다시 제안한다. */
const COOLDOWN_TURNS = 2;
const MIN_TOKEN_LENGTH = 2;

function turnIdsOf(recent: readonly RecentEvent[]): readonly string[] {
    const seen: string[] = [];
    for (const event of recent) {
        if (event.turnId === undefined) continue;
        if (seen[seen.length - 1] === event.turnId) continue;
        if (!seen.includes(event.turnId)) seen.push(event.turnId);
    }
    return seen;
}

/** 경로 구분자와 확장자를 토큰으로 풀어야 프롬프트의 토큰과 대조할 수 있다. */
function tokensOf(text: string): ReadonlySet<string> {
    const out = new Set<string>();
    for (const token of text.toLowerCase().split(/[^\p{L}\p{N}]+/gu)) {
        if (token.length >= MIN_TOKEN_LENGTH) out.add(token);
    }
    return out;
}

/** 직전 턴들이 실제로 다룬 파일과 도구이며, 이번 프롬프트와 하나도 겹치지 않으면 작업이 바뀌었다고 본다. */
function footprintOf(recent: readonly RecentEvent[], turnIds: ReadonlySet<string>): ReadonlySet<string> {
    const out = new Set<string>();
    for (const event of recent) {
        if (event.turnId === undefined || !turnIds.has(event.turnId)) continue;
        for (const path of event.filePaths ?? []) {
            for (const token of tokensOf(path)) out.add(token);
        }
        if (event.toolName !== undefined) {
            for (const token of tokensOf(event.toolName)) out.add(token);
        }
        if (event.title !== undefined) {
            for (const token of tokensOf(event.title)) out.add(token);
        }
    }
    return out;
}

function overlaps(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
    for (const token of left) {
        if (right.has(token)) return true;
    }
    return false;
}

function turnsSinceLastBoundary(recent: readonly RecentEvent[], turnIds: readonly string[]): number | null {
    for (let index = recent.length - 1; index >= 0; index -= 1) {
        const event = recent[index];
        if (event === undefined || event.kind !== KIND.boundaryLogged) continue;
        const at = event.turnId === undefined ? -1 : turnIds.indexOf(event.turnId);
        return at < 0 ? Number.POSITIVE_INFINITY : turnIds.length - 1 - at;
    }
    return null;
}

/** 자르지 않고 경계만 남기라고 제안하며, 오탐의 대가가 쓰이지 않는 마커 하나뿐이라 문턱을 낮게 둔다. */
export function detectTopicShift(recent: readonly RecentEvent[], prompt: string): PreprocessingHint[] {
    const trimmed = prompt.trim();
    if (trimmed === "") return [];

    const turnIds = turnIdsOf(recent);
    if (turnIds.length < MIN_TURNS) return [];

    const sinceBoundary = turnsSinceLastBoundary(recent, turnIds);
    if (sinceBoundary !== null && sinceBoundary < COOLDOWN_TURNS) return [];

    const lookback = new Set(turnIds.slice(-LOOKBACK_TURNS));
    const footprint = footprintOf(recent, lookback);
    if (footprint.size === 0) return [];

    // 대조할 토큰이 없으면 작업이 바뀌었는지 알 수 없으므로 판단하지 않는다.
    const promptTokens = tokensOf(trimmed);
    if (promptTokens.size === 0) return [];
    if (overlaps(promptTokens, footprint)) return [];

    return [{
        type: "topic_shift",
        severity: "info",
        title: "This looks like different work",
        message:
            "This request does not touch anything the last few turns did. If it is a different piece of "
            + "work, call mark_boundary so it can be split into its own task after the session ends. "
            + "If it is a continuation, ignore this.",
    }];
}
