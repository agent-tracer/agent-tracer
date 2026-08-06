import type {BoundSession} from "~plugin/domain/binding/application/read.binding.usecase.js";
import {readBinding, appendIngestEvents, mcpRuntime} from "~plugin/agent/claude-code/mcp/composition.js";
import {CLAUDE_RUNTIME_SOURCE, resolveClaudeSessionId} from "~plugin/config/env.js";
import {
    CREATE_MEMO_TOOL,
    parseCreateMemoArgs,
} from "~plugin/domain/memo/model/create.memo.tool.model.js";
import {
    SEARCH_MEMOS_TOOL,
    parseSearchMemosArgs,
} from "~plugin/domain/memo/model/search.memos.tool.model.js";
import {onMemoCreateRequested, onMemoSearchRequested} from "~plugin/domain/memo/inbound/memo.hook.js";
import type {MemoSearchResultItem} from "~plugin/domain/memo/port/memo.search.port.js";
import {recipeInjectedEvent} from "~plugin/domain/ingest/model/recipe.injection.event.model.js";
import {GET_RECIPE_TOOL, parseGetRecipeArgs} from "~plugin/domain/recipe/model/get.recipe.tool.model.js";
import {
    REPORT_RECIPE_OUTCOME_TOOL,
    parseReportRecipeOutcomeArgs,
} from "~plugin/domain/recipe/model/report.recipe.outcome.tool.model.js";
import {REQUEST_RECIPE_SCAN_TOOL} from "~plugin/domain/recipe/model/request.recipe.scan.tool.model.js";
import {
    SEARCH_RECIPES_TOOL,
    parseSearchRecipesArgs,
} from "~plugin/domain/recipe/model/search.recipes.tool.model.js";
import {
    onGetRecipe,
    onRecipeMarkCleared,
    onRecipeOpened,
    onRecipeOutcomeReported,
    onRecipeScanAvailabilityRequested,
    onRecipeScanRequested,
    onRecipeSearchRequested,
} from "~plugin/domain/recipe/inbound/recipe.hook.js";
import type {RecipeSearchResultItem} from "~plugin/domain/recipe/port/recipe.search.port.js";
import {onSetTaskTitleRequested} from "~plugin/domain/session/inbound/session.hook.js";
import {
    SET_TASK_TITLE_TOOL,
    parseSetTaskTitleArgs,
} from "~plugin/domain/session/model/set.task.title.tool.model.js";
import {
    MARK_BOUNDARY_TOOL,
    parseMarkBoundaryArgs,
} from "~plugin/domain/session/model/mark.boundary.tool.model.js";
import {boundaryLoggedEvent} from "~plugin/domain/session/model/boundary.event.model.js";
import type {McpToolSpec} from "~plugin/support/mcp.tool.js";

/** 사용자의 /recipe 발화와 같은 명령 접두사를 합성해 기존 스캔 경로를 그대로 태운다. */
const MCP_RECIPE_SCAN_PROMPT = "/recipe";
const UNKNOWN_SESSION = "unknown_session";

/** MCP tools/list가 배포와 무관하게 늘 광고하는 도구다. */
const ALWAYS_AVAILABLE_TOOLS: readonly McpToolSpec[] = [
    GET_RECIPE_TOOL,
    SEARCH_RECIPES_TOOL,
    REPORT_RECIPE_OUTCOME_TOOL,
    SET_TASK_TITLE_TOOL,
    MARK_BOUNDARY_TOOL,
    CREATE_MEMO_TOOL,
    SEARCH_MEMOS_TOOL,
];

/** tools/list가 이번 호출에서 실제로 광고할 도구를 정하며, 잡 접수 창구가 없는 배포에서는 request_recipe_scan을 뺀다. */
export async function resolveAvailableTools(): Promise<readonly McpToolSpec[]> {
    const scanAvailable = await onRecipeScanAvailabilityRequested(mcpRuntime.recipe);
    return scanAvailable
        ? [...ALWAYS_AVAILABLE_TOOLS, REQUEST_RECIPE_SCAN_TOOL]
        : ALWAYS_AVAILABLE_TOOLS;
}

export interface ToolCallResult {
    readonly text: string;
    readonly isError: boolean;
}

function invalidArgs(): ToolCallResult {
    return {text: "Invalid arguments.", isError: true};
}

function formatMemoSearchResult(items: readonly MemoSearchResultItem[]): string {
    if (items.length === 0) return "No memos found on the active task.";
    return items
        .map((item) => `## memo ${item.id} (author: ${item.author}${item.eventId ? `, event: ${item.eventId}` : ""})\n${item.body}`)
        .join("\n\n---\n\n");
}

function formatRecipeSearchResult(items: readonly RecipeSearchResultItem[]): string {
    if (items.length === 0) return "Nothing saved here fits that.";
    return items
        .map((item) => `## ${item.title} (recipeId: ${item.recipeId})\nintent: ${item.intent}\n${item.description}`)
        .join("\n\n---\n\n");
}

/** 이 MCP 서버 프로세스가 딸린 세션의 바인딩을 스스로 찾으며, 못 찾으면 추정하지 않고 undefined를 낸다. */
function resolveTarget(): BoundSession | undefined {
    const sessionId = resolveClaudeSessionId();
    return sessionId === undefined ? undefined : readBinding.execute(CLAUDE_RUNTIME_SOURCE, sessionId);
}

/** 레시피 본문은 이미 확보했으므로 적용 이력 기록이 로컬 파일 쓰기에 실패해도 도구 호출을 막지 않는다. */
async function recordRecipeInjection(target: BoundSession, recipeId: string): Promise<void> {
    try {
        await appendIngestEvents.execute([
            recipeInjectedEvent(target, {
                recipeId,
                applicationId: mcpRuntime.ids.next(),
                injectedVia: "pull",
            }),
        ]);
    } catch {
        // 스풀 기록 실패가 넛지 트리거인 마크까지 지우지는 않는다.
    }
    onRecipeOpened(mcpRuntime.recipeOutcomeMark, target.taskId, recipeId);
}

/** tools/call이 넘긴 도구 이름과 인자를 실제 처리로 위임하고 사람이 읽을 결과 텍스트를 만든다. */
export async function callTool(name: string, args: unknown): Promise<ToolCallResult> {
    switch (name) {
        case GET_RECIPE_TOOL.name: {
            const parsed = parseGetRecipeArgs(args);
            if (!parsed) return invalidArgs();
            const fetched = await onGetRecipe(mcpRuntime.recipe, parsed.recipeId);
            if (fetched.kind === "unavailable" || fetched.kind === "unsupported") {
                return {text: "Could not reach the recipe server. Try again.", isError: true};
            }
            const target = resolveTarget();
            if (fetched.kind === "absent") {
                if (target !== undefined) onRecipeMarkCleared(mcpRuntime.recipeOutcomeMark, target.taskId, parsed.recipeId);
                return {text: `Recipe not found: ${parsed.recipeId}`, isError: true};
            }
            if (target !== undefined) await recordRecipeInjection(target, parsed.recipeId);
            return {text: fetched.value, isError: false};
        }
        case REPORT_RECIPE_OUTCOME_TOOL.name: {
            const parsed = parseReportRecipeOutcomeArgs(args);
            if (!parsed) return invalidArgs();
            const target = resolveTarget();
            if (target === undefined) {
                return {text: `Could not record outcome (${UNKNOWN_SESSION}).`, isError: true};
            }
            const result = await onRecipeOutcomeReported(mcpRuntime.recipe, {
                recipeId: parsed.recipeId,
                taskId: target.taskId,
                outcome: parsed.outcome,
                ...(parsed.note !== undefined ? {note: parsed.note} : {}),
            });
            if (result === "unavailable") {
                return {text: "Could not reach the server to record the outcome. Try again.", isError: true};
            }
            onRecipeMarkCleared(mcpRuntime.recipeOutcomeMark, target.taskId, parsed.recipeId);
            return result === "accepted"
                ? {text: "Outcome recorded.", isError: false}
                : {text: `Recipe no longer exists: ${parsed.recipeId}`, isError: true};
        }
        case REQUEST_RECIPE_SCAN_TOOL.name: {
            // tools/list가 이 도구를 이미 감췄어야 하지만, 캐시된 목록으로 부를 수 있어 한 번 더 확인한다.
            if (!(await onRecipeScanAvailabilityRequested(mcpRuntime.recipe))) {
                return {text: "Recipe scanning is not available in this deployment.", isError: false};
            }
            const target = resolveTarget();
            if (target === undefined) return {text: `Scan not queued (${UNKNOWN_SESSION}).`, isError: true};
            const queued = await onRecipeScanRequested(mcpRuntime.recipe, {
                taskId: target.taskId,
                eventId: mcpRuntime.ids.next(),
                prompt: MCP_RECIPE_SCAN_PROMPT,
            });
            return queued
                ? {text: "Recipe scan queued.", isError: false}
                : {text: "Scan not queued.", isError: true};
        }
        case SET_TASK_TITLE_TOOL.name: {
            const parsed = parseSetTaskTitleArgs(args);
            if (!parsed) return invalidArgs();
            const target = resolveTarget();
            if (target === undefined) {
                return {text: `Could not update title (${UNKNOWN_SESSION}).`, isError: true};
            }
            const ok = await onSetTaskTitleRequested(mcpRuntime.session, target.taskId, parsed.title);
            return ok
                ? {text: "Task title updated.", isError: false}
                : {text: "Could not update title.", isError: true};
        }
        case MARK_BOUNDARY_TOOL.name: {
            const parsed = parseMarkBoundaryArgs(args);
            if (!parsed) return invalidArgs();
            const target = resolveTarget();
            if (target === undefined) {
                return {text: `Could not mark boundary (${UNKNOWN_SESSION}).`, isError: true};
            }
            await appendIngestEvents.execute([boundaryLoggedEvent(target, parsed)]);
            return {
                text: parsed.back
                    ? `Marked return to "${parsed.label}".`
                    : `Marked boundary "${parsed.label}".`,
                isError: false,
            };
        }
        case CREATE_MEMO_TOOL.name: {
            const parsed = parseCreateMemoArgs(args);
            if (!parsed) return invalidArgs();
            const target = resolveTarget();
            if (target === undefined) return {text: `Could not save memo (${UNKNOWN_SESSION}).`, isError: true};
            const ok = await onMemoCreateRequested(mcpRuntime.memo, {
                taskId: target.taskId,
                body: parsed.body,
                ...(parsed.eventId !== undefined ? {eventId: parsed.eventId} : {}),
            });
            return ok
                ? {text: "Memo saved.", isError: false}
                : {text: "Could not save memo.", isError: true};
        }
        case SEARCH_MEMOS_TOOL.name: {
            const parsed = parseSearchMemosArgs(args);
            if (!parsed) return invalidArgs();
            const target = resolveTarget();
            if (target === undefined) return {text: formatMemoSearchResult([]), isError: false};
            const fetched = await onMemoSearchRequested(mcpRuntime.memo, {
                taskId: target.taskId,
                ...(parsed.query !== undefined ? {query: parsed.query} : {}),
                ...(parsed.limit !== undefined ? {limit: parsed.limit} : {}),
            });
            if (fetched.kind === "unavailable") {
                return {text: "Could not reach the memo server. Try again.", isError: true};
            }
            return {text: formatMemoSearchResult(fetched.kind === "found" ? fetched.value : []), isError: false};
        }
        case SEARCH_RECIPES_TOOL.name: {
            const parsed = parseSearchRecipesArgs(args);
            if (!parsed) return invalidArgs();
            const fetched = await onRecipeSearchRequested(mcpRuntime.recipe, {
                query: parsed.query,
                ...(parsed.limit !== undefined ? {limit: parsed.limit} : {}),
            });
            if (fetched.kind === "unavailable") {
                return {text: "Could not reach the recipe server to search. Try again.", isError: true};
            }
            return {text: formatRecipeSearchResult(fetched.kind === "found" ? fetched.value : []), isError: false};
        }
        default:
            return {text: `Unknown tool: ${name}`, isError: true};
    }
}
