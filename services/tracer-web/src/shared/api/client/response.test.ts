import { describe, expect, it } from "vitest";
import {
  createResponseError,
  isNotImplementedError,
} from "~tracer-web/shared/api/client/response.js";

describe("createResponseError", () => {
  it("서버 오류 envelope의 상태와 코드를 보존한다", async () => {
    const error = await createResponseError(
      Response.json(
        {
          ok: false,
          error: {
            code: "not_found",
            message: "missing task",
            details: { taskId: "task-1" },
          },
        },
        { status: 404 },
      ),
      "/api/v1/tasks/task-1",
      "GET",
    );

    expect(error).toMatchObject({
      message: "missing task",
      status: 404,
      pathname: "/api/v1/tasks/task-1",
      code: "not_found",
      details: { taskId: "task-1" },
    });
  });
});

describe("isNotImplementedError", () => {
  it("501 응답 오류를 창구 부재로 읽는다", async () => {
    const error = await createResponseError(
      Response.json({}, { status: 501 }),
      "/api/agent/settings",
      "GET",
    );

    expect(isNotImplementedError(error)).toBe(true);
  });

  it("다른 상태와 오류가 아닌 값은 창구 부재가 아니다", async () => {
    const error = await createResponseError(
      Response.json({}, { status: 503 }),
      "/api/agent/settings",
      "GET",
    );

    expect(isNotImplementedError(error)).toBe(false);
    expect(isNotImplementedError(null)).toBe(false);
  });
});
