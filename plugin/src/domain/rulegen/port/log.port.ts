/** 규칙 생성이 남기는 진단 한 줄이 지나는 통로다. */
export interface RulegenLogPort {
    write(message: string): void;
}
