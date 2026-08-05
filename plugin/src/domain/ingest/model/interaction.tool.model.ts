import {KIND, LANE, provenEvidence} from "~plugin/domain/ingest/model/event.model.js";
import {
    sanitizeToolInput,
    toolUseIdOf,
    type ShapedToolEvent,
    type ToolCall,
} from "~plugin/domain/ingest/model/tool.call.model.js";
import type {
    PlanLoggedMetadata,
    QuestionLoggedMetadata,
} from "~plugin/domain/ingest/model/tool.metadata.model.js";
import {createMessageId} from "~plugin/support/ulid.js";
import {toTrimmedString, truncate} from "~plugin/support/text.js";

/** 계획 모드 종료를 계획 이벤트로 만든다. */
export function shapePlanTool(call: ToolCall): ShapedToolEvent {
    const plan = toTrimmedString(call.toolInput["plan"]);

    const metadata: PlanLoggedMetadata = {
        ...provenEvidence("Observed directly by the ExitPlanMode PostToolUse hook."),
        toolName: call.toolName,
        toolInput: sanitizeToolInput(call.toolInput),
        planSource: "ExitPlanMode",
        ...toolUseIdOf(call),
    };

    return {
        kind: KIND.planLogged,
        lane: LANE.planning,
        title: "Exit plan mode",
        ...(plan ? {body: plan} : {}),
        metadata,
    };
}

/** 사용자 질문을 질문 이벤트로 만든다. */
export function shapeQuestionTool(call: ToolCall): ShapedToolEvent {
    const question = toTrimmedString(call.toolInput["question"]);
    const options = Array.isArray(call.toolInput["options"])
        ? call.toolInput["options"].filter(
            (option): option is string => typeof option === "string" && option.trim().length > 0,
        )
        : [];

    const metadata: QuestionLoggedMetadata = {
        ...provenEvidence("Observed directly by the AskUserQuestion PostToolUse hook."),
        questionId: call.toolUseId ? `tool-${call.toolUseId}` : `q-${createMessageId()}`,
        questionPhase: "asked",
        toolName: call.toolName,
        toolInput: sanitizeToolInput(call.toolInput),
        ...(options.length > 0 ? {options} : {}),
        ...toolUseIdOf(call),
    };

    return {
        kind: KIND.questionLogged,
        lane: LANE.questions,
        title: question ? `Ask: ${truncate(question, 60)}` : "User question posed",
        ...(question ? {body: question} : {}),
        metadata,
    };
}

