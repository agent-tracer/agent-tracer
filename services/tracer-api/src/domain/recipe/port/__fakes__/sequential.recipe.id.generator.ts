import type { RecipeIdGeneratorPort } from "~tracer-api/domain/recipe/port/recipe.id.generator.port.js";

export class SequentialRecipeIdGenerator implements RecipeIdGeneratorPort {
    private position = 0;

    constructor(private readonly prefix = "recipe-id") {}

    next(): string {
        this.position += 1;
        return `${this.prefix}-${this.position}`;
    }
}
