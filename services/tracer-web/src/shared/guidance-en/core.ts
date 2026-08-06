import {
  createGuidanceMessage,
  guidanceCode,
} from "~tracer-web/shared/guidance-message.js";

export const EN_COMMON = {
  guidanceUnavailable: createGuidanceMessage(
    "Guidance is not available for this view yet.",
  ),
  runCommandToContinue: (command: string) =>
    createGuidanceMessage(
      "Run ",
      guidanceCode(command),
      " to continue.",
    ),
  status: {
    running: createGuidanceMessage("The agent is actively producing events."),
    waiting: createGuidanceMessage("The agent is paused for user input."),
    done: createGuidanceMessage("The task completed successfully."),
    failed: createGuidanceMessage("The task ended with an error."),
    idle: createGuidanceMessage("No recent activity was recorded."),
    canceled: createGuidanceMessage("The job stopped before completion."),
  },
  // 서버는 사유를 코드로만 말하므로 그 코드를 화면의 말로 옮기는 자리가 여기 하나다.
  apiError: {
    unauthorized: createGuidanceMessage("Sign in again to continue."),
    forbidden: createGuidanceMessage("This account may not perform that action."),
    notFound: createGuidanceMessage("The requested item no longer exists."),
    conflict: createGuidanceMessage("The item changed since it was loaded. Reload and try again."),
    badRequest: createGuidanceMessage("The request was rejected. Check the values and try again."),
    validation: createGuidanceMessage("Some values are not in the expected shape."),
    rateLimited: createGuidanceMessage("Too many requests. Wait a moment and try again."),
    serverError: createGuidanceMessage("The monitor server failed to handle the request."),
    notImplemented: createGuidanceMessage("This deployment does not run the service that answers here."),
    unreachable: createGuidanceMessage("The monitor server did not answer. Check that it is running."),
    unknown: createGuidanceMessage("The request could not be completed."),
  },
} as const;

export const EN_APP = {
  crashRecovery: createGuidanceMessage(
    "Reloading recovers in most cases. If the error is reproducible, copy the message above into a bug report. The operator URL and message are usually enough to diagnose it.",
  ),
  noTaskSelected: createGuidanceMessage(
    "Each task collects every agent action in time order. Open one to follow it as it runs.",
  ),
  taskNotFound: createGuidanceMessage(
    "It may have been deleted in another tab, or the link may point to a stale ID.",
  ),
  taskServerUnavailable: createGuidanceMessage(
    "The monitor server did not respond. Check that it is running on the configured port, then try again.",
  ),
  eventsPending: createGuidanceMessage(
    "Events will appear here as the agent runs.",
  ),
  pageNotFound: createGuidanceMessage(
    "No screen answers at this address. The link may be out of date, or the path may have been typed by hand.",
  ),
} as const;

export const EN_SHELL = {
  shortcutToggle: createGuidanceMessage(
    "Press ",
    guidanceCode("?"),
    " at any time to toggle this panel.",
  ),
  shortcuts: {
    focusSearch: createGuidanceMessage("Focus the sidebar search input."),
    nextTask: createGuidanceMessage("Move to the next task."),
    previousTask: createGuidanceMessage("Move to the previous task."),
    rulesPage: createGuidanceMessage("Open the workspace Rules page."),
    dismiss: createGuidanceMessage("Clear search or dismiss the open drawer."),
    showPanel: createGuidanceMessage("Show or hide this shortcuts panel."),
  },
  websocketDisconnected: createGuidanceMessage(
    "The dashboard is not receiving WebSocket events. Updates resume when the monitor server returns.",
  ),
  websocketConnected: createGuidanceMessage(
    "Connected to the monitor WebSocket. Task and event updates are streaming in real time.",
  ),
} as const;
