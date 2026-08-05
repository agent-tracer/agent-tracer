import {ruleGenLogLine} from "~plugin/domain/rulegen/model/rulegen.log.model.js";
import type {RulegenLogPort} from "~plugin/domain/rulegen/port/log.port.js";

/** 데몬의 진단은 stderr 한 줄로 나가며 접두사는 로그 모델이 소유한다. */
export class StderrRulegenLogAdapter implements RulegenLogPort {
    write(message: string): void {
        process.stderr.write(ruleGenLogLine(message));
    }
}
