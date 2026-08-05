import type {RulegenLogPort} from "~plugin/domain/rulegen/port/log.port.js";

/** 테스트가 남은 진단을 그대로 읽는 로그다. */
export class RecordingRulegenLog implements RulegenLogPort {
    readonly lines: string[] = [];

    write(message: string): void {
        this.lines.push(message);
    }

    /** 조각을 담은 줄이 하나라도 있는지 본다. */
    has(fragment: string): boolean {
        return this.lines.some((line) => line.includes(fragment));
    }
}
