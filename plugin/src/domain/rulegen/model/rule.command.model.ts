import {KIND} from "@agent-tracer/kernel/ingest/event.kind.const.js";

export const RULE_GENERATION_MAX_RULES = 2;
const MAX_RULES_LIMIT = 20;

// 터미널에서 규칙 생성을 부르는 두 표면이며 플러그인 네임스페이스 접두사도 같은 명령으로 본다.
const RULE_COMMAND = /^(?:\/(?:[\w-]+:)?rule|\$rule)(?:\s|$)/i;

/** 규칙이 검증할 요구는 명령 뒤에 오며 접두사는 요구의 일부가 아니다. */
export function readRuleRequest(prompt: string): string {
    const trimmed = prompt.trimStart();
    if (!RULE_COMMAND.test(trimmed)) return "";
    return trimmed.replace(RULE_COMMAND, "").trim();
}

export function parseMaxRulesPerTask(raw: string | undefined): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) return RULE_GENERATION_MAX_RULES;
    return Math.min(parsed, MAX_RULES_LIMIT);
}

/** 사용자 입력 하나가 규칙 생성을 부를 자격이 있는지 본다. */
export function isRuleGenerationTrigger(
    kind: string,
    taskId: string,
    eventId: string,
    prompt: string,
): boolean {
    if (kind !== KIND.userMessage) return false;
    if (taskId.length === 0 || eventId.length === 0) return false;
    return readRuleRequest(prompt).length > 0;
}

/** 사용자가 이 데몬의 규칙 생성기에 건 설정이며 서버에서 도는 에이전트는 이 값을 보지 않는다. */
export interface RuleGenerationSettings {
    readonly maxRulesPerTask: number;
    readonly model: string | null;
}

/** 갱신 주기 사이에 두 유스케이스가 함께 보는 규칙 생성 설정이다. */
export class RuleGenerationSettingCache {
    private settings: RuleGenerationSettings = {
        maxRulesPerTask: RULE_GENERATION_MAX_RULES,
        model: null,
    };

    snapshot(): RuleGenerationSettings {
        return this.settings;
    }

    replace(settings: RuleGenerationSettings): void {
        this.settings = settings;
    }
}
