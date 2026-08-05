import {
    createSdkMcpServer,
    tool,
    type McpSdkServerConfigWithInstance,
    type SdkMcpToolDefinition,
} from "@anthropic-ai/claude-agent-sdk";
import {z} from "zod";
import {
    RULEGEN_MCP_SERVER,
    type RulegenToolInput,
    type RulegenToolParam,
    type RulegenToolSpec,
    type RulegenToolset,
} from "~plugin/domain/rulegen/model/rulegen.tool.model.js";

/** SDK가 받는 인자 스키마 묶음이며, 낱개 필드가 safeParse를 갖도록 코어 타입이 아닌 z.ZodType으로 세운다. */
type RulegenToolShape = Record<string, z.ZodType>;

function numberField(param: RulegenToolParam): z.ZodType {
    let field = z.number().int();
    if (param.min !== undefined) field = field.min(param.min);
    if (param.max !== undefined) field = field.max(param.max);
    return field;
}

function fieldOf(param: RulegenToolParam): z.ZodType {
    const field = (param.type === "string" ? z.string() : numberField(param)).describe(param.description);
    return param.optional ? field.optional() : field;
}

function shapeOf(spec: RulegenToolSpec): RulegenToolShape {
    const shape: RulegenToolShape = {};
    for (const param of spec.params) shape[param.name] = fieldOf(param);
    return shape;
}

/** 도구 명세 하나를 zod 인자 스키마와 도메인 핸들러를 묶은 SDK 도구로 렌더링한다. */
export function buildRulegenTools(
    specs: readonly RulegenToolSpec[],
    toolset: RulegenToolset,
): SdkMcpToolDefinition<RulegenToolShape>[] {
    return specs.map((spec) =>
        tool(spec.name, spec.description, shapeOf(spec), async (args: Record<string, unknown>) => {
            const text = await toolset[spec.name](args as unknown as RulegenToolInput);
            return {content: [{type: "text" as const, text}]};
        }));
}

/** 렌더링한 도구를 실행기가 모델에 노출하는 MCP 서버로 묶는다. */
export function createRulegenMcpServer(
    specs: readonly RulegenToolSpec[],
    toolset: RulegenToolset,
): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({name: RULEGEN_MCP_SERVER, tools: buildRulegenTools(specs, toolset)});
}
