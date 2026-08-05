import { TaskCleanupSuggestionEntity } from "../cleanup/task.cleanup.suggestion.entity.js";
import { DaemonHealthEntity } from "../daemon/daemon.health.entity.js";
import { MemoEntity } from "../memo/memo.entity.js";
import { RecipeApplicationEntity } from "../recipe/application/recipe.application.entity.js";
import { RecipeEntity } from "../recipe/recipe.entity.js";
import { RuleGenerationEntity } from "../rule/generation/rule.generation.entity.js";
import { RuleGenerationSettingsEntity } from "../rule/generation/rule.generation.settings.entity.js";
import { RuleEntity } from "../rule/rule.entity.js";
import { VerdictEntity } from "../rule/verification/verdict.entity.js";
import { SearchOutboxEntity } from "../search/search.outbox.entity.js";
import { SessionEntity } from "../session/session.entity.js";
import { TaskEntity } from "../task/task.entity.js";
import { TaskUserStateEntity } from "../task/user-state/task.user.state.entity.js";
import { TagEntity } from "../tag/tag.entity.js";
import { TaskTagEntity } from "../tag/task-tag.entity.js";
import { EventEntity } from "../timeline/event/event.entity.js";
import { TurnEntity } from "../timeline/turn/turn.entity.js";
import { UserEntity } from "../user/user.entity.js";

// DataSource 등록용 전체 엔티티 목록.
export const TRACER_ENTITIES = [
    TaskEntity,
    TaskUserStateEntity,
    SessionEntity,
    EventEntity,
    TurnEntity,
    RuleEntity,
    RuleGenerationEntity,
    RuleGenerationSettingsEntity,
    VerdictEntity,
    RecipeEntity,
    RecipeApplicationEntity,
    TaskCleanupSuggestionEntity,
    UserEntity,
    SearchOutboxEntity,
    DaemonHealthEntity,
    MemoEntity,
    TagEntity,
    TaskTagEntity,
];
