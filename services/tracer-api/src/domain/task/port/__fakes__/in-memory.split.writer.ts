import type { SplitWriterPort } from "~tracer-api/domain/task/port/split.write.port.js";

export interface RecordedMove {
    readonly sessionId: string;
    readonly fromTurnIndex: number;
    readonly toTurnIndex: number;
    readonly taskId: string;
}

/** 분리 일괄 갱신 포트의 인메모리 대역이며 어떤 구간을 어디로 옮겼는지 기록한다. */
export class InMemorySplitWriter implements SplitWriterPort {
    readonly moves: RecordedMove[] = [];
    readonly childMoves: { readonly turnIds: readonly string[]; readonly taskId: string }[] = [];
    readonly anchorMoves: { readonly turnIds: readonly string[]; readonly taskId: string }[] = [];
    readonly refreshed: string[][] = [];
    readonly deleted: string[] = [];

    /** 세션의 턴 인덱스로 턴 id를 찾는 표이며, 없는 인덱스는 그 구간에 턴이 없다는 뜻이다. */
    turnIdsByIndex = new Map<number, string>();

    /** 실제로는 같은 DB라 태스크 저장소에서도 사라지므로 대역끼리도 그 사실을 맞춘다. */
    onDeleteTask: ((userId: string, taskId: string) => void) | null = null;

    moveTurns(
        _userId: string,
        sessionId: string,
        fromTurnIndex: number,
        toTurnIndex: number,
        taskId: string,
    ): Promise<readonly string[]> {
        this.moves.push({ sessionId, fromTurnIndex, toTurnIndex, taskId });
        const turnIds: string[] = [];
        for (let index = fromTurnIndex; index <= toTurnIndex; index += 1) {
            const turnId = this.turnIdsByIndex.get(index);
            if (turnId !== undefined) turnIds.push(turnId);
        }
        return Promise.resolve(turnIds);
    }

    moveChildTasks(_userId: string, turnIds: readonly string[], taskId: string): Promise<number> {
        this.childMoves.push({ turnIds, taskId });
        return Promise.resolve(0);
    }

    moveRuleAnchors(_userId: string, turnIds: readonly string[], taskId: string): Promise<number> {
        this.anchorMoves.push({ turnIds, taskId });
        return Promise.resolve(0);
    }

    refreshTaskActivity(_userId: string, taskIds: readonly string[]): Promise<void> {
        this.refreshed.push([...taskIds]);
        return Promise.resolve();
    }

    deleteTask(userId: string, taskId: string): Promise<void> {
        this.deleted.push(taskId);
        this.onDeleteTask?.(userId, taskId);
        return Promise.resolve();
    }
}
