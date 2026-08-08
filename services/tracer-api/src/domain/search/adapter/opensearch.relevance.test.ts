import { describe, expect, it } from "vitest";
import { relevanceMust, relevanceSort } from "~tracer-api/domain/search/adapter/opensearch.relevance.js";

describe("검색 관련도", () => {
    it("질의어가 있으면 _score를 첫 정렬 키로 둔다", () => {
        expect(relevanceSort("useChatExecutionUpdates", "occurredAt")).toEqual([
            { _score: "desc" },
            { occurredAt: "desc" },
        ]);
    });

    it("질의어가 없으면 최신순만 남긴다", () => {
        expect(relevanceSort(undefined, "occurredAt")).toEqual([{ occurredAt: "desc" }]);
        expect(relevanceSort("", "occurredAt")).toEqual([{ occurredAt: "desc" }]);
    });

    it("부분 문자열 일치를 phrase로 가산해 흩어진 bigram 일치보다 앞세운다", () => {
        const [clause] = relevanceMust("입력값", ["title", "body"]) as [
            { bool: { should: { multi_match: { type?: string; boost?: number } }[] } },
        ];
        const phrase = clause.bool.should.find((one) => one.multi_match.type === "phrase");
        const loose = clause.bool.should.find((one) => one.multi_match.type === undefined);

        expect(phrase?.multi_match.boost).toBeGreaterThan(1);
        expect(loose).toBeDefined();
        expect(clause.bool).toMatchObject({ minimum_should_match: 1 });
    });

    it("질의어가 없으면 전체를 매치해 필터만으로 목록을 낸다", () => {
        expect(relevanceMust(undefined, ["body"])).toEqual([{ match_all: {} }]);
    });
});
