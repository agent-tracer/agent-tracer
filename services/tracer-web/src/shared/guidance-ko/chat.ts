import {
  createGuidanceMessage,
} from "~tracer-web/shared/guidance-message.js";

export const KO_CHAT = {
  workspaceIntroduction: createGuidanceMessage(
    "태스크, 규칙, 메모, 레시피에 대해 에이전트에게 물어보거나, 대신 변경을 맡기세요.",
  ),
  loadError: createGuidanceMessage("모니터 서버 연결을 확인하세요."),
  threadsEmpty: createGuidanceMessage(
    "아직 대화가 없습니다. New thread로 시작하세요.",
  ),
  conversationEmpty: createGuidanceMessage(
    "메시지를 보내 이 대화를 시작하세요.",
  ),
  selectThread: createGuidanceMessage(
    "대화를 선택하거나 새로 시작하세요.",
  ),
  streamError: createGuidanceMessage(
    "대화 스트림이 예기치 않게 끊겼습니다. 다시 보내 보세요.",
  ),
  confirmDescription: createGuidanceMessage(
    "에이전트가 데이터를 바꾸는 작업을 제안했습니다. 승인하면 실행되고, 거절하면 실행되지 않습니다.",
  ),
  memoryUpdated: createGuidanceMessage(
    "에이전트가 앞으로의 대화를 위해 이 내용을 기억했습니다.",
  ),
  deleteConfirm: createGuidanceMessage(
    "이 대화와 모든 메시지를 완전히 지웁니다. 되돌릴 수 없습니다.",
  ),
  clickToRename: createGuidanceMessage("클릭해서 대화 제목을 바꿉니다."),
  stoppedByDeadline: createGuidanceMessage(
    "이 턴이 시간 제한에 걸려 도중에 멈췄습니다. 이미 한 일은 저장돼 있으니 메시지를 보내 이어가세요.",
  ),
  stoppedByStall: createGuidanceMessage(
    "이 턴이 더 진행되지 않아 중단됐습니다. 메시지를 보내 다시 시도하세요.",
  ),
  stoppedByBudget: createGuidanceMessage(
    "이 턴이 비용 상한에 닿아, 그때까지 모은 것으로 결론을 냈습니다.",
  ),
  stoppedByTurnLimit: createGuidanceMessage(
    "이 턴이 도구 호출 횟수를 모두 써서 일찍 마무리했습니다.",
  ),
  stoppedByFailure: createGuidanceMessage(
    "이 턴이 오류로 끝났습니다. 이미 한 일은 저장돼 있습니다.",
  ),
  thinking: createGuidanceMessage("생각 중…"),
  toolRunning: createGuidanceMessage("실행 중"),
  queuedToSend: createGuidanceMessage("대기 중"),
} as const;
