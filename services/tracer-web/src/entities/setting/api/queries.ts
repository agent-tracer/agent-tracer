import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ModelOptionDto } from "@agent-tracer/kernel";
import { fetchAppSettings, fetchModelOptions } from "~tracer-web/entities/setting/api/api-settings.js";
import type { AppSettingsListResponse } from "~tracer-web/entities/setting/model/setting.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

export function useAppSettingsQuery(): UseQueryResult<AppSettingsListResponse> {
  return useQuery({
    queryKey: monitorQueryKeys.settings(),
    queryFn: fetchAppSettings,
  });
}

export function useModelOptionsQuery(): UseQueryResult<readonly ModelOptionDto[]> {
  return useQuery({
    queryKey: monitorQueryKeys.modelOptions(),
    queryFn: fetchModelOptions,
    staleTime: Infinity,
  });
}
