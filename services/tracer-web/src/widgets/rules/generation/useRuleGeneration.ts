import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { RuleGenerationRecord } from "~tracer-web/entities/rule/api/api-rule-generations.js";
import {
  useCancelRuleGenerationMutation,
  useRequestRuleGenerationMutation,
  useRuleGenerationSettingsQuery,
  useRuleGenerationsQuery,
} from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { useTaskUserInputsQuery } from "~tracer-web/entities/task/api/detail-queries.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";
import {
  isSettledRuleGeneration,
  readRuleGenerationIntent,
} from "~tracer-web/widgets/rules/generation/rule-generation.js";

/** 태스크 하나를 보다가 그 자리에서 규칙을 뽑는 화면 상태다. */
export function useRuleGeneration(taskId: TaskId, taskStatus: string | null) {
  const queryClient = useQueryClient();
  const settingsQuery = useRuleGenerationSettingsQuery();
  const userInputsQuery = useTaskUserInputsQuery(taskId);
  const generationsQuery = useRuleGenerationsQuery(taskId);
  const request = useRequestRuleGenerationMutation();
  const cancel = useCancelRuleGenerationMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [intentDraft, setIntentDraft] = useState("");
  const [anchorEventId, setAnchorEventId] = useState("");

  const userInputs = useMemo(() => userInputsQuery.data ?? [], [userInputsQuery.data]);
  const latestInputId = userInputs.at(-1)?.eventId ?? "";
  useEffect(() => {
    if (latestInputId) setAnchorEventId(latestInputId);
  }, [latestInputId]);

  const record: RuleGenerationRecord | null = generationsQuery.data?.[0] ?? null;
  const isInFlight = record !== null && !isSettledRuleGeneration(record.status);

  // 종결한 실행이 규칙을 남겼으면 그 태스크의 규칙 목록이 다시 읽혀야 화면에 뜬다.
  const settledWithRules = record !== null && isSettledRuleGeneration(record.status)
    ? `${record.id}:${record.createdRuleIds.length}`
    : null;
  useEffect(() => {
    if (settledWithRules === null) return;
    void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.taskRules(taskId) });
    void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.rules() });
  }, [settledWithRules, queryClient, taskId]);

  const generate = async () => {
    setErrorMessage(null);
    try {
      await request.mutateAsync({
        taskId,
        anchorEventId,
        ...(intentDraft.trim().length > 0 ? { intent: intentDraft.trim() } : {}),
        ...(settingsQuery.data !== undefined ? { maxRules: settingsQuery.data.maxRulesPerTask } : {}),
      });
      setIntentDraft("");
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const stop = async () => {
    if (record === null) return;
    setErrorMessage(null);
    try {
      await cancel.mutateAsync(record.id);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const settingsLoaded = !settingsQuery.isLoading;
  const disabled = !settingsLoaded || isInFlight || anchorEventId === "";
  const operationalBlockingReason = !settingsLoaded
    ? "Loading settings…"
    : isInFlight
      ? "Generation already in progress."
      : null;
  const incompleteTimelineStatus = !operationalBlockingReason && taskStatus !== "completed"
    ? taskStatus ?? "unknown"
    : null;

  return {
    anchorEventId,
    disabled,
    errorMessage,
    generate,
    incompleteTimelineStatus,
    intentDraft,
    isInFlight,
    lastIntent: readRuleGenerationIntent(record),
    operationalBlockingReason,
    record,
    setAnchorEventId,
    setIntentDraft,
    stop,
    userInputs,
  } as const;
}

export type RuleGenerationController = ReturnType<typeof useRuleGeneration>;
