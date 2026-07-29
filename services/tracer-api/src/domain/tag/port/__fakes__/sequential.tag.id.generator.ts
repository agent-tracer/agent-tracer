import type { TagIdGeneratorPort } from "~tracer-api/domain/tag/port/tag.id.generator.port.js";

export class SequentialTagIdGenerator implements TagIdGeneratorPort {
    private position = 0;

    constructor(private readonly prefix = "tag-id") {}

    next(): string {
        this.position += 1;
        return `${this.prefix}-${this.position}`;
    }
}
