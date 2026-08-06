import type { VerdictRealignerPort } from "~tracer-api/domain/task/port/verdict.realigner.port.js";

/** 판정 재정렬 포트의 인메모리 대역이며 어떤 턴과 태스크로 불렸는지 기록한다. */
export class InMemoryVerdictRealigner implements VerdictRealignerPort {
    readonly calls: { readonly turnIds: readonly string[]; readonly taskIds: readonly string[] }[] = [];
    dropped = 0;

    realign(_userId: string, movedTurnIds: readonly string[], taskIds: readonly string[]): Promise<number> {
        this.calls.push({ turnIds: movedTurnIds, taskIds });
        return Promise.resolve(this.dropped);
    }
}
