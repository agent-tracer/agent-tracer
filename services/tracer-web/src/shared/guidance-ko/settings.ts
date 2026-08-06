import {
  createGuidanceMessage,
  guidanceCode,
  guidanceStrong,
} from "~tracer-web/shared/guidance-message.js";

export const KO_SETTINGS = {
  introduction: createGuidanceMessage(
    "서버 설정은 PostgreSQL에 저장됩니다. 민감한 값은 AES-256-GCM으로 암호화되며 저장 후에는 마스킹되어 표시됩니다. 값을 바꾸려면 새 값을 입력하세요.",
  ),
  securityNote: createGuidanceMessage(
    "민감한 설정은 ",
    guidanceCode("MONITOR_SETTINGS_ENCRYPTION_KEY"),
    "를 사용해 AES-256-GCM으로 암호화됩니다. 로컬 개발 이외의 환경에서는 이 키를 반드시 직접 설정하세요. 내장된 개발용 대체 키는 공유 환경이나 운영 환경에 적합하지 않습니다.",
  ),
  guidanceLanguage: createGuidanceMessage(
    "이 브라우저의 설명 문구 언어만 바꿉니다. 조작 버튼과 상태 레이블은 영어로 유지되며, 기록된 에이전트 콘텐츠는 원문 그대로 표시됩니다.",
  ),
  identityIntroduction: createGuidanceMessage(
    "태스크와 이벤트는 사용자별로 분류됩니다. 기본 ",
    guidanceCode("local"),
    " 신원은 설정할 필요가 없습니다. 이메일을 지정하면 이 브라우저 활동을 분리하고 Claude Code 훅 이벤트를 같은 사용자에게 연결할 수 있습니다.",
  ),
  identityStorage: createGuidanceMessage(
    "이 브라우저에만 저장됩니다. 값을 바꾸면 페이지가 새로고침됩니다.",
  ),
  identityReset: createGuidanceMessage(
    "이 브라우저의 사용자 신원을 지우고 ",
    guidanceCode("local"),
    " 사용자로 되돌립니다.",
  ),
  hookSetup: (email: string) =>
    createGuidanceMessage(
      "Claude Code 훅 이벤트를 ",
      guidanceStrong(email),
      " 사용자에게 연결하려면 이 값을 환경 설정에 추가하세요. 설정하지 않으면 훅 활동은 ",
      guidanceCode("local"),
      " 사용자로 기록됩니다.",
    ),
  ruleGenerationIntroduction: createGuidanceMessage(
    "공급자 인증 정보는 서버 AI 잡과 규칙 생성에 사용됩니다. API 키가 없다면 Claude Code에서 ",
    guidanceCode("/rule"),
    " 명령을 실행해 CLI 자체 인증으로 로컬 생성기를 사용할 수 있습니다.",
  ),
  anthropicApiKey: createGuidanceMessage(
    "서버에서 도는 AI 잡이 사용자를 대신해 Anthropic을 부를 때 씁니다. 로컬 규칙 생성기는 대신 CLI 자체 인증을 씁니다.",
  ),
  anthropicModel: createGuidanceMessage(
    "제목 제안과 레시피 스캔과 정리 제안이 쓸 모델입니다. 비워 두면 잡마다 정해진 기본 모델을 쓰며, 예산과 턴 상한은 모델을 바꿔도 잡이 그대로 갖습니다.",
  ),
  maxRules: createGuidanceMessage(
    guidanceCode("/generate-rules"),
    "가 반환할 수 있는 최대 규칙 수입니다. 기본값은 5입니다.",
  ),
  outputLanguage: createGuidanceMessage(
    "제목 제안과 레시피 스캔과 정리 제안이 낼 결과의 언어입니다. 요청이 언어를 지정하면 그 값이 우선하며, Auto는 원본 태스크의 언어를 따릅니다.",
  ),
  taskCleanupMaxSuggestions: createGuidanceMessage(
    "정리 제안 한 번이 낼 수 있는 최대 보관 후보 수입니다. 요청이 개수를 지정하면 그 값이 우선하며, 비워 두면 20을 씁니다.",
  ),
  ruleGenerationSection: createGuidanceMessage(
    "내 기계에서 도는 데몬이 규칙을 뽑을 때 쓰는 설정입니다. 에이전트 서비스와 무관하게 이 워크스페이스가 소유합니다.",
  ),
  llmProviderScope: createGuidanceMessage(
    "이 값은 에이전트 서비스가 실행하는 잡(제목 제안·레시피 스캔·정리 제안)에만 쓰입니다. 로컬 규칙 생성은 아래 Rule generation 설정을 읽습니다.",
  ),
  valueRequired: createGuidanceMessage("저장하기 전에 값을 입력하세요."),
  settingSaved: (label: string) => createGuidanceMessage(`${label} 설정을 저장했습니다.`),
  settingCleared: (label: string) => createGuidanceMessage(`${label} 설정을 지웠습니다.`),
  settingSaveFailed: (label: string) => createGuidanceMessage(`${label} 설정을 저장하지 못했습니다.`),
  settingClearFailed: (label: string) => createGuidanceMessage(`${label} 설정을 지우지 못했습니다.`),
  identityFailed: createGuidanceMessage("사용자를 지정하지 못했습니다."),
  daemonUnreachable: createGuidanceMessage(
    "데몬이 보고하지 않아 제어 화면에 닿을 수 없습니다.",
  ),
  daemonControls: createGuidanceMessage(
    "스풀을 비우거나, 실패한 항목을 다시 넣거나, 데몬을 다시 시작합니다.",
  ),
} as const;
