import { Inject, Injectable } from "@nestjs/common";
import { generateUlid } from "@agent-tracer/platform";
import { CLOCK, type ClockPort } from "~tracer-api/domain/cleanup/port/clock.port.js";
import type { CleanupIdGeneratorPort } from "~tracer-api/domain/cleanup/port/cleanup.id.generator.port.js";

@Injectable()
export class CleanupUlidGenerator implements CleanupIdGeneratorPort {
    constructor(@Inject(CLOCK) private readonly clock: ClockPort) {}

    next(): string {
        return generateUlid(this.clock.now().getTime());
    }
}
