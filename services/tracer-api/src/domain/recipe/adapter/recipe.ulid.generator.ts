import { Inject, Injectable } from "@nestjs/common";
import { generateUlid } from "@agent-tracer/platform";
import { CLOCK, type ClockPort } from "~tracer-api/domain/recipe/port/clock.port.js";
import type { RecipeIdGeneratorPort } from "~tracer-api/domain/recipe/port/recipe.id.generator.port.js";

@Injectable()
export class RecipeUlidGenerator implements RecipeIdGeneratorPort {
    constructor(@Inject(CLOCK) private readonly clock: ClockPort) {}

    next(): string {
        return generateUlid(this.clock.now().getTime());
    }
}
