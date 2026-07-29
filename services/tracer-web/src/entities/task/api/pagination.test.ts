import { describe, expect, test } from "vitest";
import { buildTasksPath } from "~tracer-web/entities/task/api/pagination.js";

describe("buildTasksPath", () => {
  test("기본값 archived=active는 서버 계약대로 archived=false로 매핑된다", () => {
    expect(buildTasksPath({ limit: 50 })).toBe("/api/v1/tasks?archived=false&limit=50");
  });

  test("archived=archived는 서버의 archived=true로 매핑된다", () => {
    expect(buildTasksPath({ archived: "archived", limit: 50 })).toBe(
      "/api/v1/tasks?archived=true&limit=50",
    );
  });

  test("archived=all이면 파라미터 자체를 생략한다", () => {
    expect(buildTasksPath({ archived: "all", limit: 50 })).toBe("/api/v1/tasks?limit=50");
  });

  test("origin=all과 status=all은 기본값이므로 생략한다", () => {
    expect(buildTasksPath({ origin: "all", status: "all", limit: 50 })).toBe(
      "/api/v1/tasks?archived=false&limit=50",
    );
  });

  test("기본값이 아닌 origin과 status는 둘 다 포함한다", () => {
    expect(buildTasksPath({ origin: "user", status: "running", limit: 50 })).toBe(
      "/api/v1/tasks?archived=false&origin=user&status=running&limit=50",
    );
  });

  test("cursor는 존재할 때만 포함한다", () => {
    expect(buildTasksPath({ limit: 50 })).not.toContain("cursor");
    expect(buildTasksPath({ limit: 50, cursor: "abc123" })).toBe(
      "/api/v1/tasks?archived=false&limit=50&cursor=abc123",
    );
  });

  test("모든 옵션을 조합하면 기본값이 아닌 파라미터가 전부 나온다", () => {
    const path = buildTasksPath({
      archived: "all",
      origin: "server-sdk",
      status: "errored",
      limit: 25,
      cursor: "xyz",
    });
    expect(path).toBe(
      "/api/v1/tasks?origin=server-sdk&status=errored&limit=25&cursor=xyz",
    );
  });
});
