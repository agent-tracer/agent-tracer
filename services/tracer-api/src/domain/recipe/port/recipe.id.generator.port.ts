export const RECIPE_ID_GENERATOR = Symbol("RECIPE_ID_GENERATOR");

export interface RecipeIdGeneratorPort {
    next(): string;
}
