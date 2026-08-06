import {
  createGuidanceMessage,
  guidanceCode,
  guidanceStrong,
} from "~tracer-web/shared/guidance-message.js";

export const EN_SETTINGS = {
  introduction: createGuidanceMessage(
    "Server settings are stored in PostgreSQL. Sensitive values are encrypted with AES-256-GCM and shown masked after save; enter a new value to replace one.",
  ),
  securityNote: createGuidanceMessage(
    "Sensitive settings are encrypted with AES-256-GCM using ",
    guidanceCode("MONITOR_SETTINGS_ENCRYPTION_KEY"),
    ". Configure that key outside local development. The built-in development fallback is not suitable for shared or production environments.",
  ),
  guidanceLanguage: createGuidanceMessage(
    "Changes explanatory text in this browser. Controls, status labels, and recorded agent content remain in English or in their original language.",
  ),
  identityIntroduction: createGuidanceMessage(
    "Tasks and events are grouped by user. The default ",
    guidanceCode("local"),
    " identity needs no setup. Set an email to separate this browser activity and attribute Claude Code hook events to the same user.",
  ),
  identityStorage: createGuidanceMessage(
    "Stored only in this browser. Changing it reloads the page.",
  ),
  identityReset: createGuidanceMessage(
    "This browser's user identity will be cleared and changed back to ",
    guidanceCode("local"),
    ".",
  ),
  hookSetup: (email: string) =>
    createGuidanceMessage(
      "Add this value to the Claude Code environment so hook events are attributed to ",
      guidanceStrong(email),
      ". Without it, hook activity is recorded as the ",
      guidanceCode("local"),
      " user.",
    ),
  ruleGenerationIntroduction: createGuidanceMessage(
    "Provider credentials configure server-side AI jobs and rule generation. Without an API key, use ",
    guidanceCode("/rule"),
    " in Claude Code to run the local generator with the CLI's own authentication.",
  ),
  anthropicApiKey: createGuidanceMessage(
    "Lets server-side AI jobs call Anthropic on your behalf. The local rule generator uses the CLI's own authentication instead.",
  ),
  anthropicModel: createGuidanceMessage(
    "Model used by title suggestions, recipe scans, and cleanup suggestions. Leave it empty to use each job's own default; budget and turn limits stay with the job even when the model changes.",
  ),
  maxRules: createGuidanceMessage(
    "Maximum number of rules returned by ",
    guidanceCode("/generate-rules"),
    ". The default is 5.",
  ),
  outputLanguage: createGuidanceMessage(
    "Language for the output of title suggestions, recipe scans, and cleanup suggestions. A language named by the request wins over this value, and Auto follows the language of the source task.",
  ),
  taskCleanupMaxSuggestions: createGuidanceMessage(
    "Largest number of archive candidates one cleanup suggestion job may return. A count named by the request wins over this value; leave it empty to use 20.",
  ),
  ruleGenerationSection: createGuidanceMessage(
    "Settings the daemon on your machine reads when it generates rules. This workspace owns them, independent of the agent service.",
  ),
  llmProviderScope: createGuidanceMessage(
    "These values are used only by jobs that run on the agent service — title suggestions, recipe scans, and cleanup suggestions. Local rule generation reads the Rule generation settings below.",
  ),
  valueRequired: createGuidanceMessage("Enter a value before saving."),
  settingSaved: (label: string) => createGuidanceMessage(`Saved ${label}.`),
  settingCleared: (label: string) => createGuidanceMessage(`Cleared ${label}.`),
  settingSaveFailed: (label: string) => createGuidanceMessage(`Could not save ${label}.`),
  settingClearFailed: (label: string) => createGuidanceMessage(`Could not clear ${label}.`),
  identityFailed: createGuidanceMessage("The identity could not be set."),
  daemonUnreachable: createGuidanceMessage(
    "The daemon is not reporting, so its control page is unreachable.",
  ),
  daemonControls: createGuidanceMessage(
    "Flush the spool, requeue dead-letters, or restart the daemon.",
  ),
} as const;
