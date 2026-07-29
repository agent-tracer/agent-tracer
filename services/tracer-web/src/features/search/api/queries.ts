import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { SearchResponse } from "~tracer-web/features/search/model/search.js";
import { fetchSearch } from "~tracer-web/features/search/api/api-search.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

export function useSearchQuery(
  searchType: "tasks" | "events",
  query: string,
  options?: { readonly taskId?: TaskId; readonly limit?: number },
): UseQueryResult<SearchResponse> {
  const trimmed = query.trim();
  return useQuery({
    queryKey: monitorQueryKeys.search(searchType, trimmed, options?.taskId),
    queryFn: () =>
      fetchSearch(searchType, trimmed, {
        ...(options?.taskId ? { taskId: options.taskId } : {}),
        ...(options?.limit !== undefined ? { limit: options.limit } : {}),
      }),
    enabled: trimmed.length > 0,
  });
}
