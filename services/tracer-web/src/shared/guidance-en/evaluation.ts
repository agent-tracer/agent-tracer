import { createGuidanceMessage } from "~tracer-web/shared/guidance-message.js";
export const EN_EVALUATION = {
  introduction: createGuidanceMessage(
    "Build immutable datasets, version prompts, and compare controlled experiment variants before promotion.",
  ),
  disclosure: createGuidanceMessage(
    "Review every example disclosure class before sending evaluation data to an external tracing service.",
  ),
  unavailable: createGuidanceMessage(
    "Blind review and automatic promotion gates are not exposed by the server yet. They remain disabled instead of simulating a decision.",
  ),
  experimentLookup: createGuidanceMessage(
    "The API does not list experiments yet. Paste an experiment ID returned after creation to reopen its workspace.",
  ),
  fragmentLoading: createGuidanceMessage("Loading prompt fragment bindings…"),
  fragmentEmpty: createGuidanceMessage("No prompt fragment bindings are registered for this backend."),
  fragmentError: createGuidanceMessage("Could not load prompt fragment bindings."),
  fragmentDefault: createGuidanceMessage("Code default"),
  fragmentOverride: createGuidanceMessage("Database override"),
  fragmentIntegrity: createGuidanceMessage("Integrity"),
  fragmentMatched: createGuidanceMessage("matched"),
  fragmentMismatch: createGuidanceMessage("mismatch"),
  fragmentSelectionHint: createGuidanceMessage("Choose a database version for this slot, or keep the code default."),
};
