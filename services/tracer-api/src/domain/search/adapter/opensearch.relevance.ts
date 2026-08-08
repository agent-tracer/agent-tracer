// 본문이 2글자 ngram으로 색인돼 거의 모든 문서가 하나 이상 일치하므로 순위는 _score로만 결정되며, occurredAt으로 정렬하면 그 _score를 버린다.

/** bigram이 순서대로 이어진 문서, 즉 부분 문자열이 일치한 문서에 주는 가중치다. */
const PHRASE_BOOST = 4;

/** 질의어가 있으면 부분 문자열 일치를 우선하는 must 절이고 없으면 전체를 매치한다. */
export function relevanceMust(q: string | undefined, fields: readonly string[]): Record<string, unknown>[] {
    if (!q) return [{ match_all: {} }];
    return [
        {
            bool: {
                should: [
                    { multi_match: { query: q, fields: [...fields], type: "phrase", boost: PHRASE_BOOST } },
                    { multi_match: { query: q, fields: [...fields] } },
                ],
                minimum_should_match: 1,
            },
        },
    ];
}

/** 질의어가 있으면 _score를 먼저 보고 없으면 최신순이며, 동점에서는 최신순을 따른다. */
export function relevanceSort(q: string | undefined, recencyField: string): Record<string, unknown>[] {
    const recency = { [recencyField]: "desc" };
    return q ? [{ _score: "desc" }, recency] : [recency];
}
