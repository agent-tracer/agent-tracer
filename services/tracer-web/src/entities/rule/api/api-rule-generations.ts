import {
  RULE_GENERATIONS_PATH,
  RULE_GENERATION_SETTINGS_PATH,
  type RuleGenerationStatus,
  type RuleGenerationSettingsDto,
} from "@agent-tracer/kernel";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { getJson, patchPut, postJson } from "~tracer-web/shared/api/client/json-methods.js";

/** 실행이 잰 것이며 실패해도 그때까지 청구된 값을 그대로 싣는다. */
export interface RuleGenerationObservation {
  readonly model: string | null;
  readonly costUsd: number | null;
  readonly numTurns: number | null;
  readonly durationMs: number | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly cacheReadTokens: number | null;
  readonly cacheCreationTokens: number | null;
}

export interface RuleGenerationRecord {
  readonly id: string;
  readonly taskId: TaskId;
  readonly anchorEventId: string;
  readonly intent: string | null;
  readonly maxRules: number | null;
  readonly status: RuleGenerationStatus;
  readonly observation: RuleGenerationObservation;
  readonly skipped: readonly string[];
  readonly createdRuleIds: readonly string[];
  readonly error: string | null;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
}

export interface RuleGenerationRequestInput {
  readonly taskId: TaskId;
  readonly anchorEventId: string;
  readonly intent?: string;
  readonly maxRules?: number;
}

export async function fetchRuleGenerations(taskId?: TaskId): Promise<readonly RuleGenerationRecord[]> {
  const query = taskId === undefined ? "" : `?taskId=${encodeURIComponent(taskId)}`;
  const res = await getJson<{ readonly items: readonly RuleGenerationRecord[] }>(
    `${RULE_GENERATIONS_PATH}${query}`,
  );
  return res.items;
}

export function requestRuleGeneration(
  body: RuleGenerationRequestInput,
): Promise<{ readonly request: RuleGenerationRecord; readonly created: boolean }> {
  return postJson(RULE_GENERATIONS_PATH, body);
}

export function cancelRuleGeneration(
  id: string,
): Promise<{ readonly request: RuleGenerationRecord; readonly canceled: boolean }> {
  return postJson(`${RULE_GENERATIONS_PATH}/${encodeURIComponent(id)}/cancel`, {});
}

export async function fetchRuleGenerationSettings(): Promise<RuleGenerationSettingsDto> {
  const res = await getJson<{ readonly settings: RuleGenerationSettingsDto }>(RULE_GENERATION_SETTINGS_PATH);
  return res.settings;
}

export type RuleGenerationSettingsPatch = Partial<{
  readonly maxRulesPerTask: number | null;
  readonly model: string | null;
  readonly outputLanguage: string | null;
  readonly effort: string | null;
}>;

export async function saveRuleGenerationSettings(
  patch: RuleGenerationSettingsPatch,
): Promise<RuleGenerationSettingsDto> {
  const res = await patchPut<{ readonly settings: RuleGenerationSettingsDto }>(
    RULE_GENERATION_SETTINGS_PATH,
    patch,
  );
  return res.settings;
}
