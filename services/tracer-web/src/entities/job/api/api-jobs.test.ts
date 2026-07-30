import { beforeEach, describe, expect, it, vi } from "vitest";
import { JOB_KIND } from "~tracer-web/entities/job/model/job.js";
import { TaskId } from "~tracer-web/shared/identity.js";
import type { GenerateRulesJobStatus } from "~tracer-web/entities/job/model/rule-generation.js";
import { getJson, postJson } from "~tracer-web/shared/api/client/json-methods.js";
import {
  cancelJob,
  enqueueJob,
  fetchJob,
  fetchJobSteps,
  fetchLatestJob,
} from "~tracer-web/entities/job/api/api-jobs.js";

vi.mock("~tracer-web/shared/api/client/json-methods.js", () => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
}));

const mockGetJson = vi.mocked(getJson);
const mockPostJson = vi.mocked(postJson);

beforeEach(() => {
  mockGetJson.mockReset();
  mockPostJson.mockReset();
});

describe("enqueueJob", () => {
  it("idempotency key를 요청 본문에 싣는다", async () => {
    mockPostJson.mockResolvedValue({ job: { id: "job-1", status: "pending" } });

    await enqueueJob(JOB_KIND.recipeScan, { filters: {} }, { idempotencyKey: "scan-click-1" });

    expect(mockPostJson).toHaveBeenCalledWith("/api/agent/jobs", {
      kind: JOB_KIND.recipeScan,
      input: { filters: {} },
      idempotencyKey: "scan-click-1",
    });
  });

  it("선택 필드 없이 잡을 접수한다", async () => {
    mockPostJson.mockResolvedValue({ job: { id: "job-1", status: "pending" } });

    await enqueueJob(JOB_KIND.recipeScan, { taskId: "task-1" });

    expect(mockPostJson).toHaveBeenCalledWith("/api/agent/jobs", {
      kind: JOB_KIND.recipeScan,
      input: { taskId: "task-1" },
    });
  });
});

describe("cancelJob", () => {
  it("잡 식별자만 받아 고정 경로로 취소한다", async () => {
    mockPostJson.mockResolvedValue({ job: { id: "job-1" } });

    await cancelJob({ id: "job-1" });

    expect(mockPostJson).toHaveBeenCalledWith("/api/agent/jobs/job-1/cancel", {});
  });
});

describe("fetchLatestJob", () => {
  it("서버 JobDto의 result와 usage를 화면용 잡 상태로 정규화한다", async () => {
    mockGetJson.mockResolvedValue({
      job: {
        id: "job-1",
        userId: "u1",
        kind: JOB_KIND.ruleGeneration,
        executor: "local",
        status: "completed",
        attempts: 1,
        taskId: "task-1",
        input: { taskId: "task-1" },
        result: { rulesCreated: 3 },
        usage: { model: "claude-sonnet-4-6", durationMs: 1234 },
        error: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:02.000Z",
        startedAt: "2026-01-01T00:00:01.000Z",
        completedAt: "2026-01-01T00:00:02.234Z",
      },
    });

    const res = await fetchLatestJob<GenerateRulesJobStatus>(
      JOB_KIND.ruleGeneration,
      { taskId: TaskId("task-1") },
    );

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/agent/jobs/latest?kind=rule.generation&taskId=task-1",
    );
    expect(res.job).toMatchObject({
      id: "job-1",
      kind: JOB_KIND.ruleGeneration,
      status: "completed",
      rulesCreated: 3,
      modelUsed: "claude-sonnet-4-6",
      durationMs: 1234,
    });
  });
});

describe("fetchJobEvidence", () => {
  it("잡 상세와 trajectory를 인코딩된 잡 경로로 조회한다", async () => {
    mockGetJson
      .mockResolvedValueOnce({ job: { id: "job/1" } })
      .mockResolvedValueOnce([{
        seq: 0,
        role: "assistant",
        content: "Inspect task evidence",
        truncated: false,
        toolCalls: [],
      }]);

    const job = await fetchJob("job/1");
    const steps = await fetchJobSteps("job/1");

    expect(mockGetJson).toHaveBeenNthCalledWith(1, "/api/agent/jobs/job%2F1");
    expect(mockGetJson).toHaveBeenNthCalledWith(2, "/api/agent/jobs/job%2F1/steps");
    expect(job.job.id).toBe("job/1");
    expect(steps[0]?.content).toBe("Inspect task evidence");
  });
});
