import {
  createGuidanceMessage,
} from "~tracer-web/shared/guidance-message.js";

export const EN_CHAT = {
  workspaceIntroduction: createGuidanceMessage(
    "Ask the agent about your tasks, rules, memos, and recipes, or have it make changes on your behalf.",
  ),
  loadError: createGuidanceMessage(
    "Check the monitor server connection.",
  ),
  threadsEmpty: createGuidanceMessage(
    "No conversations yet. Start one with New thread.",
  ),
  conversationEmpty: createGuidanceMessage(
    "Send a message to start this conversation.",
  ),
  selectThread: createGuidanceMessage(
    "Select a conversation or start a new one.",
  ),
  streamError: createGuidanceMessage(
    "The conversation stream ended unexpectedly. Try sending again.",
  ),
  confirmDescription: createGuidanceMessage(
    "The agent proposed a change that writes data. Approve to run it, or reject to leave it undone.",
  ),
  memoryUpdated: createGuidanceMessage(
    "The agent remembered this for future conversations.",
  ),
  deleteConfirm: createGuidanceMessage(
    "This deletes the conversation and all of its messages for good. This can't be undone.",
  ),
  clickToRename: createGuidanceMessage("Click to rename this conversation."),
  stoppedByDeadline: createGuidanceMessage(
    "This turn hit its time limit and stopped partway. Anything it already did is saved — send a message to pick it up.",
  ),
  stoppedByStall: createGuidanceMessage(
    "This turn stopped making progress and was ended. Send a message to try again.",
  ),
  stoppedByBudget: createGuidanceMessage(
    "This turn reached its cost limit, so the agent wrapped up with what it had.",
  ),
  stoppedByTurnLimit: createGuidanceMessage(
    "This turn used all of its tool-calling steps and had to conclude early.",
  ),
  stoppedByFailure: createGuidanceMessage(
    "This turn ended on an error. Anything it already did is saved.",
  ),
  thinking: createGuidanceMessage("Thinking…"),
  toolRunning: createGuidanceMessage("Running"),
  queuedToSend: createGuidanceMessage("Queued"),
} as const;
