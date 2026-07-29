import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  acceptTaskCleanupSuggestion,
  dismissTaskCleanupSuggestion,
} from "~tracer-web/entities/task-cleanup/api/api-task-cleanup.js";
import { monitorQueryKeys } from "~tracer-web/shared/api/query-keys.js";

export function useAcceptCleanupSuggestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (suggestionId: string) => acceptTaskCleanupSuggestion(suggestionId),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: monitorQueryKeys.taskCleanupSuggestionsPrefix(),
      });
      void queryClient.invalidateQueries({ queryKey: monitorQueryKeys.tasksPrefix() });
    },
  });
}

export function useDismissCleanupSuggestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (suggestionId: string) => dismissTaskCleanupSuggestion(suggestionId),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: monitorQueryKeys.taskCleanupSuggestionsPrefix(),
      });
    },
  });
}
