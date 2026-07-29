import type {RuleGenerationSettings} from "~plugin/domain/rulegen/model/rule.command.model.js";

/** 이 데몬의 규칙 생성 설정을 서버 설정 창구에서 읽는다. */
export interface RuleSettingPort {
    fetch(): Promise<RuleGenerationSettings | null>;
}
