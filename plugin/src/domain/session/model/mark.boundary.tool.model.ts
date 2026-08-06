import type {McpToolSpec} from "~plugin/support/mcp.tool.js";
import {isRecord} from "~plugin/support/json.js";

/** 이 도구를 언제 부를지는 설명 문구가 정하므로 문구 자체가 설계물이다. */
export const MARK_BOUNDARY_TOOL: McpToolSpec = {
    name: "mark_boundary",
    description:
        "Mark the point where this session's work changes to a different piece of work, or comes back "
        + "from one. Agent Tracer records tasks as one unit per session, so a detour recorded inside "
        + "another task blurs both. You cannot split a task while its session is running — this mark is "
        + "how the boundary survives until it can be split afterwards. Call it when the request in front "
        + "of you is not a continuation of what you were doing: different feature, different bug, an "
        + "aside the user asked for mid-flight. Pass back=true when returning to what you were doing "
        + "before. Do not mark ordinary progress within the same piece of work, and do not mark a "
        + "boundary you already marked. The tool identifies its own session, so you pass no ids.",
    inputSchema: {
        type: "object",
        properties: {
            label: {
                type: "string",
                description: "Short name for the work that starts here (a few words).",
            },
            back: {
                type: "boolean",
                description: "True when this returns to the work that was interrupted.",
            },
        },
        required: ["label"],
    },
};

export interface MarkBoundaryArgs {
    readonly label: string;
    readonly back: boolean;
}

export function parseMarkBoundaryArgs(value: unknown): MarkBoundaryArgs | null {
    if (!isRecord(value)) return null;
    const label = value["label"];
    if (typeof label !== "string" || label.trim() === "") return null;
    return {label: label.trim(), back: value["back"] === true};
}
