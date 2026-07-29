import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchRecipes } from "~tracer-web/entities/recipe/api/api-recipes.js";
import type { RecipesResponse, RecipeStatusFilter } from "~tracer-web/entities/recipe/model/recipe.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

export function useRecipesQuery(
  status: RecipeStatusFilter = "active",
): UseQueryResult<RecipesResponse> {
  return useQuery({
    queryKey: monitorQueryKeys.recipes(status),
    queryFn: () => fetchRecipes(status),
  });
}
