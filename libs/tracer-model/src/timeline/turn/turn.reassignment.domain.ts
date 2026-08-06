import { InvariantViolationError } from "~tracer-model/error/invariant.error.js";

/** 이미 저장된 구간 하나이며 정규화의 입력이다. */
export interface StoredRange {
    readonly id: string;
    readonly fromTurnIndex: number;
    readonly toTurnIndex: number;
    readonly taskId: string;
    readonly originTaskId: string;
}

/** 아직 id가 없는 구간이며 정규화의 산출이다. */
export type DraftRange = Omit<StoredRange, "id">;

/** 겹침을 없앤 뒤의 저장 계획이며, 조회는 우선순위 규칙 없이 구간을 그대로 읽는다. */
export interface RangePlan {
    readonly removedIds: readonly string[];
    readonly updated: readonly StoredRange[];
    readonly created: readonly DraftRange[];
}

function assertBounds(from: number, to: number): void {
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
        throw new InvariantViolationError("turn-range.not-integer");
    }
    if (from < 1) throw new InvariantViolationError("turn-range.index-too-small");
    if (to < from) throw new InvariantViolationError("turn-range.inverted");
}

/** 새 구간을 넣으면서 겹치는 기존 구간을 잘라 내며, 조회가 배치마다 도는 경로라 우선순위 판정 대신 저장 시점에 겹침을 없앤다. */
export function planRangeInsert(existing: readonly StoredRange[], incoming: DraftRange): RangePlan {
    assertBounds(incoming.fromTurnIndex, incoming.toTurnIndex);

    const removedIds: string[] = [];
    const updated: StoredRange[] = [];
    const created: DraftRange[] = [incoming];

    for (const range of existing) {
        const overlaps = range.fromTurnIndex <= incoming.toTurnIndex && incoming.fromTurnIndex <= range.toTurnIndex;
        if (!overlaps) continue;

        const headSurvives = range.fromTurnIndex < incoming.fromTurnIndex;
        const tailSurvives = range.toTurnIndex > incoming.toTurnIndex;

        // 새 구간이 기존 구간을 통째로 덮으면 남는 조각이 없다.
        if (!headSurvives && !tailSurvives) {
            removedIds.push(range.id);
            continue;
        }
        // 기존 구간이 새 구간을 안고 있으면 앞뒤 두 조각으로 갈라진다.
        if (headSurvives) {
            updated.push({ ...range, toTurnIndex: incoming.fromTurnIndex - 1 });
        }
        if (tailSurvives) {
            const tail = { ...range, fromTurnIndex: incoming.toTurnIndex + 1 };
            if (headSurvives) {
                const { id: _id, ...draft } = tail;
                created.push(draft);
            } else {
                updated.push(tail);
            }
        }
    }

    return { removedIds, updated, created };
}

/** 턴 하나가 속한 태스크이며, 어떤 구간에도 들지 않으면 원래 태스크에 그대로 남는다. */
export function resolveTurnTaskId(
    ranges: readonly StoredRange[],
    turnIndex: number,
    fallbackTaskId: string,
): string {
    for (const range of ranges) {
        if (turnIndex >= range.fromTurnIndex && turnIndex <= range.toTurnIndex) return range.taskId;
    }
    return fallbackTaskId;
}

/** 분리된 태스크로 옮겨간 턴 인덱스 전부이며, 원본 피드가 턴 번호가 뛰는 자리를 설명할 때 쓴다. */
export function movedTurnIndexes(ranges: readonly StoredRange[]): readonly number[] {
    const out: number[] = [];
    for (const range of ranges) {
        for (let index = range.fromTurnIndex; index <= range.toTurnIndex; index += 1) out.push(index);
    }
    return [...new Set(out)].sort((left, right) => left - right);
}
