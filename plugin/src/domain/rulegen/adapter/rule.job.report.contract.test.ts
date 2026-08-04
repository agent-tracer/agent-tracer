import {readFileSync} from "node:fs";
import {afterEach, describe, expect, it, vi} from "vitest";
import {HttpRuleJobAdapter} from "~plugin/domain/rulegen/adapter/http.rule.job.adapter.js";
import type {
    RuleGenerationFailure,
    RuleGenerationReport,
} from "~plugin/domain/rulegen/model/rule.job.model.js";

// 실행기가 두 창구에 실어 보내는 본문의 정본은 계약의 OpenAPI 한 자리다.
const SPEC = readFileSync(
    new URL("../../../../../contract/http/agent-api.openapi.yaml", import.meta.url),
    "utf8",
);

/** 계약이 그 본문에 요구하는 칸의 이름을 낸다. */
function requiredFields(schemaName: string): string[] {
    const declared = new RegExp(`\\n    ${schemaName}:\\n(?: {6}.*\\n)*? {6}required: \\[([^\\]]*)\\]`)
        .exec(SPEC);
    if (declared === null) throw new Error(`${schemaName} 이 요구하는 칸을 선언하지 않는다`);
    return declared[1]!.split(",").map((name) => name.trim());
}

/** 계약이 그 본문에 허용하는 칸의 이름을 낸다. */
function allowedFields(schemaName: string): string[] {
    const block = new RegExp(`\\n    ${schemaName}:\\n((?: {6}.*\\n)*)`).exec(SPEC);
    if (block === null) throw new Error(`${schemaName} 을 계약이 선언하지 않는다`);
    const properties = /\n {6}properties:\n((?: {8}.*\n)*)/.exec(block[1]!);
    if (properties === null) throw new Error(`${schemaName} 이 칸을 선언하지 않는다`);
    return [...properties[1]!.matchAll(/^ {8}(\w+):/gm)].map((found) => found[1]!);
}

const REPORT: RuleGenerationReport = {
    proposals: [{id: "r1"} as never],
    skipped: ["Rule #2 violates the output schema."],
    modelUsed: "claude",
    durationMs: 10,
    costUsd: 0.1,
    numTurns: 1,
    steps: [],
};

const FAILURE: RuleGenerationFailure = {
    error: "boom",
    modelUsed: "claude",
    durationMs: 10,
    costUsd: null,
    numTurns: 1,
    steps: [],
};

/** 그 왕복이 실제로 실어 보낸 본문을 낸다. */
async function sentBody(send: (adapter: HttpRuleJobAdapter) => Promise<unknown>): Promise<Record<string, unknown>> {
    const sent: string[] = [];
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
        sent.push(typeof init.body === "string" ? init.body : "");
        return new Response(JSON.stringify({}), {status: 200});
    });
    await send(new HttpRuleJobAdapter("http://127.0.0.1:3847", {}, "owner-1"));
    return JSON.parse(sent[0]!) as Record<string, unknown>;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("실행기가 창구에 싣는 본문", () => {
    it("산출 보고가 계약이 요구하는 칸을 싣고 모르는 칸을 싣지 않는다", async () => {
        const body = await sentBody((adapter) => adapter.reportResult("job-1", REPORT));

        expect(Object.keys(body)).toEqual(expect.arrayContaining(requiredFields("RuleJobReportBody")));
        expect(allowedFields("RuleJobReportBody")).toEqual(expect.arrayContaining(Object.keys(body)));
        expect(body["rules"]).toEqual(REPORT.proposals);
        expect(body["skipped"]).toEqual(REPORT.skipped);
    });

    it("실패 보고가 계약이 요구하는 칸을 싣고 모르는 칸을 싣지 않는다", async () => {
        const body = await sentBody((adapter) => adapter.fail("job-1", FAILURE));

        expect(Object.keys(body)).toEqual(expect.arrayContaining(requiredFields("RuleJobFailureBody")));
        expect(allowedFields("RuleJobFailureBody")).toEqual(expect.arrayContaining(Object.keys(body)));
        expect(body["message"]).toBe(FAILURE.error);
    });
});
