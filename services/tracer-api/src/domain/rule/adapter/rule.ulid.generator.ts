import { Inject, Injectable } from "@nestjs/common";
import { generateUlid } from "@agent-tracer/platform";
import { CLOCK, type ClockPort } from "~tracer-api/domain/rule/port/clock.port.js";
import type { RuleIdGeneratorPort } from "~tracer-api/domain/rule/port/rule.id.generator.port.js";

@Injectable()
export class RuleUlidGenerator implements RuleIdGeneratorPort {
    constructor(@Inject(CLOCK) private readonly clock: ClockPort) {}

    next(): string {
        return generateUlid(this.clock.now().getTime());
    }
}
