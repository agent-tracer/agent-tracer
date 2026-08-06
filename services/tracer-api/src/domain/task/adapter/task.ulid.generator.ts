import { Inject, Injectable } from "@nestjs/common";
import { generateUlid } from "@agent-tracer/platform";
import { CLOCK, type ClockPort } from "~tracer-api/domain/task/port/clock.port.js";
import type { TaskIdGeneratorPort } from "~tracer-api/domain/task/port/task.id.generator.port.js";

@Injectable()
export class TaskUlidGenerator implements TaskIdGeneratorPort {
    constructor(@Inject(CLOCK) private readonly clock: ClockPort) {}

    next(): string {
        return generateUlid(this.clock.now().getTime());
    }
}
