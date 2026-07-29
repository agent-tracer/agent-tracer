import { Inject, Injectable } from "@nestjs/common";
import { generateUlid } from "@agent-tracer/platform";
import { CLOCK, type ClockPort } from "~tracer-api/domain/tag/port/clock.port.js";
import type { TagIdGeneratorPort } from "~tracer-api/domain/tag/port/tag.id.generator.port.js";

@Injectable()
export class TagUlidGenerator implements TagIdGeneratorPort {
    constructor(@Inject(CLOCK) private readonly clock: ClockPort) {}

    next(): string {
        return generateUlid(this.clock.now().getTime());
    }
}
