import type { TurnBoundaryDto } from "@agent-tracer/kernel";

/** 실행 중에 남긴 경계 마커 하나다. */
export interface BoundaryMark {
    readonly sessionId: string;
    readonly turnIndex: number;
    readonly label: string;
    readonly back: boolean;
    readonly occurredAt: string;
}

/** 여는 마커와 복귀 마커를 짝지어 닫힌 구간으로 만들며, 복귀가 없으면 그 세션의 마지막 턴까지가 구간이다. */
export function pairBoundaries(
    marks: readonly BoundaryMark[],
    lastTurnIndexBySession: ReadonlyMap<string, number>,
): readonly TurnBoundaryDto[] {
    const ordered = [...marks].sort(
        (left, right) => left.turnIndex - right.turnIndex || left.occurredAt.localeCompare(right.occurredAt),
    );

    const out: TurnBoundaryDto[] = [];
    const openBySession = new Map<string, BoundaryMark>();

    for (const mark of ordered) {
        const open = openBySession.get(mark.sessionId);
        if (!mark.back) {
            // 복귀 없이 다음 경계가 열리면 앞 구간은 그 자리에서 끝난 것으로 본다.
            if (open !== undefined) out.push(closed(open, mark.turnIndex - 1));
            openBySession.set(mark.sessionId, mark);
            continue;
        }
        if (open === undefined) continue;
        out.push(closed(open, mark.turnIndex - 1));
        openBySession.delete(mark.sessionId);
    }

    for (const [sessionId, open] of openBySession) {
        out.push(closed(open, lastTurnIndexBySession.get(sessionId) ?? open.turnIndex));
    }

    return out.filter((item) => item.toTurnIndex >= item.fromTurnIndex);
}

function closed(open: BoundaryMark, toTurnIndex: number): TurnBoundaryDto {
    return {
        sessionId: open.sessionId,
        fromTurnIndex: open.turnIndex,
        toTurnIndex,
        label: open.label,
        markedAt: open.occurredAt,
    };
}
