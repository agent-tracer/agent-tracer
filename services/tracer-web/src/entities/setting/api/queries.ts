import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ModelOptionDto } from "@agent-tracer/kernel";
import { fetchAppSettings, fetchModelOptions } from "~tracer-web/entities/setting/api/api-settings.js";
import type { AppSettingsListResponse } from "~tracer-web/entities/setting/model/setting.js";
import { isNotImplementedError } from "~tracer-web/shared/api/client/response.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

// 창구가 없다는 확답은 다시 물어도 같으므로 재시도하지 않는다.
function retryUnlessMissingSurface(failureCount: number, error: Error): boolean {
  return !isNotImplementedError(error) && failureCount < 1;
}

export function useAppSettingsQuery(): UseQueryResult<AppSettingsListResponse> {
  return useQuery({
    queryKey: monitorQueryKeys.settings(),
    queryFn: fetchAppSettings,
    retry: retryUnlessMissingSurface,
  });
}

export function useModelOptionsQuery(): UseQueryResult<readonly ModelOptionDto[]> {
  return useQuery({
    queryKey: monitorQueryKeys.modelOptions(),
    queryFn: fetchModelOptions,
    staleTime: Infinity,
    retry: retryUnlessMissingSurface,
  });
}
