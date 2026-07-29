import { createGuidanceMessage } from "~tracer-web/shared/guidance-message.js";
export const KO_EVALUATION = {
  introduction: createGuidanceMessage(
    "승격 전에 변경 불가능한 데이터셋과 프롬프트 버전을 만들고 통제된 실험 변형을 비교합니다.",
  ),
  disclosure: createGuidanceMessage(
    "평가 데이터를 외부 추적 서비스로 보내기 전에 모든 예제의 공개 등급을 검토하세요.",
  ),
  unavailable: createGuidanceMessage(
    "블라인드 검토와 자동 승격 게이트는 아직 서버 API로 제공되지 않습니다. 의사결정을 흉내 내지 않고 비활성 상태로 표시합니다.",
  ),
  experimentLookup: createGuidanceMessage(
    "아직 실험 목록 API가 없습니다. 생성 응답으로 받은 실험 ID를 붙여 넣어 작업 공간을 다시 여세요.",
  ),
  fragmentLoading: createGuidanceMessage("프롬프트 조각 연결을 불러오는 중입니다."),
  fragmentEmpty: createGuidanceMessage("이 백엔드에 등록된 프롬프트 조각 연결이 없습니다."),
  fragmentError: createGuidanceMessage("프롬프트 조각 연결을 불러오지 못했습니다."),
  fragmentDefault: createGuidanceMessage("코드 기본값"),
  fragmentOverride: createGuidanceMessage("데이터베이스 재정의"),
  fragmentIntegrity: createGuidanceMessage("무결성"),
  fragmentMatched: createGuidanceMessage("일치"),
  fragmentMismatch: createGuidanceMessage("불일치"),
  fragmentSelectionHint: createGuidanceMessage("이 슬롯의 데이터베이스 버전을 선택하거나 코드 기본값을 유지하세요."),
};
