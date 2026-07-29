import type {RuleGenerationSettings} from "~plugin/domain/rulegen/model/rule.command.model.js";
import type {Fetched} from "~plugin/support/fetched.js";

/** 이 데몬의 규칙 생성 설정을 서버 설정 창구에서 읽으며 창구가 없으면 `unsupported`다. */
export interface RuleSettingPort {
    fetch(): Promise<Fetched<RuleGenerationSettings>>;
}
