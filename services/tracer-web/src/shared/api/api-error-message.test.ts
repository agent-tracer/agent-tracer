import { describe, expect, it } from "vitest";
import { EN_GUIDANCE } from "~tracer-web/shared/guidance-en.js";
import { KO_GUIDANCE } from "~tracer-web/shared/guidance-ko.js";
import type { ApiRequestError } from "~tracer-web/shared/api/client/response.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";

function requestError(patch: Partial<ApiRequestError>): ApiRequestError {
  return Object.assign(new Error("Rule not found"), patch);
}

const en = EN_GUIDANCE.common;
const ko = KO_GUIDANCE.common;

describe("apiErrorMessage", () => {
  it("서버가 준 코드로 화면의 말을 고른다", () => {
    expect(apiErrorMessage(en, requestError({ code: "not_found", status: 404 })))
      .toBe(en.apiError.notFound);
  });

  it("고른 언어의 목록에서 같은 자리를 고른다", () => {
    expect(apiErrorMessage(ko, requestError({ code: "not_found", status: 404 })))
      .toBe(ko.apiError.notFound);
  });

  it("코드가 없으면 상태로 고른다", () => {
    expect(apiErrorMessage(en, requestError({ status: 409 }))).toBe(en.apiError.conflict);
  });

  it("모르는 5xx는 서버 오류로 묶는다", () => {
    expect(apiErrorMessage(en, requestError({ status: 503 }))).toBe(en.apiError.serverError);
  });

  it("상태가 없으면 응답을 받지 못한 것으로 본다", () => {
    expect(apiErrorMessage(en, requestError({}))).toBe(en.apiError.unreachable);
  });

  it("오류가 아닌 값도 말을 하나 갖는다", () => {
    expect(apiErrorMessage(en, "boom")).toBe(en.apiError.unknown);
  });

  it("서버 문구를 화면으로 흘리지 않는다", () => {
    const message = apiErrorMessage(en, requestError({ code: "not_found", status: 404 }));

    expect(message).not.toBe(en.apiError.unknown);
    expect(message).toBe(en.apiError.notFound);
  });
});
