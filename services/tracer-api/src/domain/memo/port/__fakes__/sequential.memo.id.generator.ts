import type { MemoIdGeneratorPort } from "~tracer-api/domain/memo/port/memo.id.generator.port.js";

export class SequentialMemoIdGenerator implements MemoIdGeneratorPort {
    private position = 0;

    constructor(private readonly prefix = "memo-id") {}

    next(): string {
        this.position += 1;
        return `${this.prefix}-${this.position}`;
    }
}
