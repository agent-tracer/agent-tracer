/** 서버에게 물은 결과이며 `found`는 응답값, `absent`는 자원이 없다는 확답(404), `unsupported`는 그 창구를 세우는 서비스가 배포에 없다는 확답(501), `unavailable`은 확답을 못 받음(그 외 상태·타임아웃·네트워크 실패)이다. */
export type Fetched<T> =
    | {readonly kind: "found"; readonly value: T}
    | {readonly kind: "absent"}
    | {readonly kind: "unsupported"}
    | {readonly kind: "unavailable"};
