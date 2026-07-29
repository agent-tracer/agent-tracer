import {afterEach, describe, expect, it, vi} from "vitest";
import {HttpRuleSettingAdapter} from "~plugin/domain/rulegen/adapter/http.rule.setting.adapter.js";

const BASE_URL = "http://127.0.0.1:3847";

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json"}});
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("HttpRuleSettingAdapter", () => {
    it("설정 목록에서 ruleGen.maxRulesPerTask 항목을 찾아 파싱한다", async () => {
        const requested: string[] = [];
        const fetchSpy = vi.fn(async (url: string) => {
            requested.push(url);
            return jsonResponse({
                data: {
                    items: [
                        {key: "anthropic.model", maskedValue: "claude-x"},
                        {key: "ruleGen.maxRulesPerTask", maskedValue: "5"},
                    ],
                },
            });
        });
        vi.stubGlobal("fetch", fetchSpy);

        const fetched = await new HttpRuleSettingAdapter(BASE_URL, {}).fetch();

        expect(fetched).toEqual({kind: "found", value: {maxRulesPerTask: 5, model: "claude-x"}});
        expect(requested).toEqual([`${BASE_URL}/api/agent/settings`]);
    });

    it("항목이 없으면 기본 상한으로 떨어진다", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => jsonResponse({data: {items: [{key: "anthropic.model", maskedValue: "claude-x"}]}})),
        );

        const fetched = await new HttpRuleSettingAdapter(BASE_URL, {}).fetch();

        expect(fetched).toEqual({kind: "found", value: {maxRulesPerTask: 2, model: "claude-x"}});
    });

    it("items 자체가 없으면 읽지 못한 것으로 본다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({data: {}})));

        expect(await new HttpRuleSettingAdapter(BASE_URL, {}).fetch()).toEqual({kind: "unavailable"});
    });

    it("응답 실패도 읽지 못한 것으로 본다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 500)));

        expect(await new HttpRuleSettingAdapter(BASE_URL, {}).fetch()).toEqual({kind: "unavailable"});
    });

    it("설정 창구가 없는 배포는 501로 확답한다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 501)));

        expect(await new HttpRuleSettingAdapter(BASE_URL, {}).fetch()).toEqual({kind: "unsupported"});
    });
});
