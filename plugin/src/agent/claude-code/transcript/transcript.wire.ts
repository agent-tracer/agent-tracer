/** Claude Code JSONL 와이어 포맷의 판별 어휘다. */

/** 트랜스크립트 엔트리의 type 필드가 갖는 값이다. */
export const TRANSCRIPT_ENTRY_TYPE = {
    assistant: "assistant",
    user: "user",
} as const;

/** 엔트리 message.role 필드가 갖는 값이다. */
export const TRANSCRIPT_MESSAGE_ROLE = {
    assistant: "assistant",
    user: "user",
} as const;

/** message.content 블록의 type 필드가 갖는 값이다. */
export const TRANSCRIPT_BLOCK_TYPE = {
    text: "text",
    thinking: "thinking",
} as const;

/** 도구 호출 사이 중간 발화 턴을 가르는 message.stop_reason 값이다. */
export const TRANSCRIPT_STOP_REASON = {
    toolUse: "tool_use",
} as const;
