import type { ModelOptionDto, SettingDto } from "@agent-tracer/kernel";
import type {
  AppSettingsListResponse,
  AppSettingUpsertResponse,
} from "~tracer-web/entities/setting/model/setting.js";
import { deleteRequest, getJson, patchPut } from "~tracer-web/shared/api/client/json-methods.js";

export async function fetchAppSettings(): Promise<AppSettingsListResponse> {
  const res = await getJson<{ readonly items: readonly SettingDto[] }>("/api/v1/settings");
  return { settings: res.items };
}

export async function fetchModelOptions(): Promise<readonly ModelOptionDto[]> {
  const res = await getJson<{ readonly items: readonly ModelOptionDto[] }>("/api/v1/settings/models");
  return res.items;
}

export function putAppSetting(
  key: string,
  value: string,
): Promise<AppSettingUpsertResponse> {
  return patchPut<AppSettingUpsertResponse>(
    `/api/v1/settings/${encodeURIComponent(key)}`,
    { value },
  );
}

export function deleteAppSetting(
  key: string,
): Promise<{ readonly deleted: boolean; readonly key: string }> {
  return deleteRequest<{ readonly deleted: boolean; readonly key: string }>(
    `/api/v1/settings/${encodeURIComponent(key)}`,
  );
}
