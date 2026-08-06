import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { RuleGenerationSettingsDto } from "@agent-tracer/kernel";
import type { TaskId } from "~tracer-web/shared/identity.js";
import {
  cancelRuleGeneration,
  clearRuleGenerations,
  deleteRuleGeneration,
  fetchRuleGenerationSettings,
  fetchRuleGenerations,
  requestRuleGeneration,
  saveRuleGenerationSettings,
  type RuleGenerationRecord,
  type RuleGenerationRequestInput,
  type RuleGenerationSettingsPatch,
} from "~tracer-web/entities/rule/api/api-rule-generations.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

/** 실행 중인 요청이 있으면 화면이 자주 다시 물어 진행이 살아 보인다. */
const ACTIVE_POLL_MS = 3000;

function hasActive(items: readonly RuleGenerationRecord[] | undefined): boolean {
  return (items ?? []).some((item) => item.status === "pending" || item.status === "running");
}

export function useRuleGenerationsQuery(taskId?: TaskId): UseQueryResult<readonly RuleGenerationRecord[]> {
  return useQuery({
    queryKey: monitorQueryKeys.ruleGenerations(taskId),
    queryFn: () => fetchRuleGenerations(taskId),
    refetchInterval: (query) => (hasActive(query.state.data) ? ACTIVE_POLL_MS : false),
  });
}

export function useRequestRuleGenerationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RuleGenerationRequestInput) => requestRuleGeneration(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.ruleGenerations() });
    },
  });
}

export function useCancelRuleGenerationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelRuleGeneration(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.ruleGenerations() });
    },
  });
}

export function useDeleteRuleGenerationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRuleGeneration(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.ruleGenerations() });
    },
  });
}

export function useClearRuleGenerationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearRuleGenerations(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.ruleGenerations() });
    },
  });
}

export function useRuleGenerationSettingsQuery(): UseQueryResult<RuleGenerationSettingsDto> {
  return useQuery({
    queryKey: monitorQueryKeys.ruleGenerationSettings(),
    queryFn: fetchRuleGenerationSettings,
  });
}

export function useSaveRuleGenerationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: RuleGenerationSettingsPatch) => saveRuleGenerationSettings(patch),
    // 다시 물어올 때까지 두면 고른 항목이 잠깐 예전 값으로 되돌아가므로 창구가 돌려준 값을 곧바로 앉힌다.
    onSuccess: (settings) => {
      queryClient.setQueryData(monitorQueryKeys.ruleGenerationSettings(), settings);
    },
  });
}
