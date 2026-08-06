import { useState } from "react";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { isGuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, GuidanceText, Input, PageHeader } from "~tracer-web/shared/ui/index.js";
import type { RecipeScanJobInput } from "~tracer-web/entities/job/model/recipe-scan.js";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { AgentBackendSelect } from "~tracer-web/features/agent-backend/AgentBackendSelect.js";
import { TaskPicker } from "~tracer-web/widgets/recipes/scan/TaskPicker.js";

interface LatestJob {
  readonly status: string;
  readonly recipes: readonly unknown[];
  readonly taskId?: TaskId;
  readonly completedAt: string | null;
  readonly error: string | null;
}

interface ScanPanelProps {
  readonly isScanning: boolean;
  readonly latestJob: LatestJob | null;
  readonly tasks: readonly MonitoringTask[];
  readonly tasksLoading: boolean;
  readonly scannedTaskIds: ReadonlySet<string>;
  readonly includeArchivedTasks: boolean;
  readonly onIncludeArchivedTasksChange: (include: boolean) => void;
  readonly onScan: (input: RecipeScanJobInput) => void;
  /** 요청이 거절된 사유이며 잡이 남긴 문구는 이 자리로 오지 않는다. */
  readonly scanError: GuidanceMessage | null;
  readonly agentBackend: string | null;
  readonly onAgentBackendChange: (backend: string) => void;
}

/** 태스크 범위를 선택해 레시피 스캔을 시작한다. */
export function ScanPanel({
  isScanning,
  latestJob,
  tasks,
  tasksLoading,
  scannedTaskIds,
  includeArchivedTasks,
  onIncludeArchivedTasksChange,
  onScan,
  scanError,
  agentBackend,
  onAgentBackendChange,
}: ScanPanelProps) {
  const guidance = useGuidance();
  // 앵커는 항상 사용자가 명시적으로 고른다.
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId | null>(null);
  const [userPrompt, setUserPrompt] = useState("");

  const failureMessage: GuidanceMessage | string | null =
    scanError ?? (latestJob?.status === "failed" ? latestJob.error : null);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Recipes"
        intro={guidance.messages.recipes.introduction}
        introLocale={guidance.locale}
        {...(latestJob
          ? {
              status: (
                <>
                  Last scan: {latestJob.status}
                  {latestJob.status === "completed" && (
                    <>
                      {" "}
                      · {latestJob.recipes.length} candidate
                      {latestJob.recipes.length === 1 ? "" : "s"}
                      {latestJob.taskId ? ` · ${latestJob.taskId.slice(0, 8)}` : ""}
                    </>
                  )}
                </>
              ),
            }
          : {})}
      />
      <div className="px-gutter py-3 border-b border-hair bg-canvas">
        {/* 폭을 100%로 고정한 칸이 있으면 그 칸이 줄을 통째로 차지하므로 두지 않는다. */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-mini text-ink-tertiary uppercase tracking-eyebrow">
              Task
            </span>
            <TaskPicker
              tasks={tasks}
              loading={tasksLoading}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
              scannedTaskIds={scannedTaskIds}
              includeArchived={includeArchivedTasks}
              onIncludeArchivedChange={onIncludeArchivedTasksChange}
              disabled={isScanning}
            />
          </label>
          <Input
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="What should the recipe capture?"
            className="min-w-[220px] flex-1"
            disabled={isScanning}
          />
          <label className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-mini text-ink-tertiary uppercase tracking-eyebrow">
              Backend
            </span>
            <AgentBackendSelect
              value={agentBackend}
              onChange={onAgentBackendChange}
              disabled={isScanning}
              className="min-w-[112px]"
            />
          </label>
          <Button
            variant="primary"
            disabled={isScanning || selectedTaskId === null}
            onClick={() => {
              if (selectedTaskId === null) return;
              onScan({
                taskId: selectedTaskId,
                ...(userPrompt.trim() ? { userPrompt: userPrompt.trim() } : {}),
              });
            }}
            className="shrink-0"
          >
            {isScanning ? "Scanning…" : "Scan"}
          </Button>
        </div>
        {failureMessage && (
          <div className="mt-2 text-body py-1.5 px-2.5 rounded-sm bg-err/8 text-err">
            {isGuidanceMessage(failureMessage) ? (
              <GuidanceText locale={guidance.locale} message={failureMessage} />
            ) : (
              failureMessage
            )}
          </div>
        )}
      </div>
    </>
  );
}
