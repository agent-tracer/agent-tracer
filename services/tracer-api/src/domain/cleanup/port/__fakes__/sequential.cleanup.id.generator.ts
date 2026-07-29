import type { CleanupIdGeneratorPort } from "~tracer-api/domain/cleanup/port/cleanup.id.generator.port.js";

export class SequentialCleanupIdGenerator implements CleanupIdGeneratorPort {
    private position = 0;

    constructor(private readonly prefix = "cleanup-id") {}

    next(): string {
        this.position += 1;
        return `${this.prefix}-${this.position}`;
    }
}
