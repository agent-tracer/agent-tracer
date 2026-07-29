import { Inject, Injectable } from "@nestjs/common";
import { generateUlid } from "@agent-tracer/platform";
import { CLOCK, type ClockPort } from "~tracer-api/domain/memo/port/clock.port.js";
import type { MemoIdGeneratorPort } from "~tracer-api/domain/memo/port/memo.id.generator.port.js";

@Injectable()
export class MemoUlidGenerator implements MemoIdGeneratorPort {
    constructor(@Inject(CLOCK) private readonly clock: ClockPort) {}

    next(): string {
        return generateUlid(this.clock.now().getTime());
    }
}
