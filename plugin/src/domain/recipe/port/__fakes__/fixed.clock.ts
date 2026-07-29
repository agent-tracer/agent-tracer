import type {ClockPort} from "~plugin/domain/recipe/port/clock.port.js";

export class FixedClock implements ClockPort {
    constructor(private current: number) {}

    now(): number {
        return this.current;
    }
}
