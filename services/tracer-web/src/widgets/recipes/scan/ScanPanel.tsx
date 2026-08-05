import { useState } from "react";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { isGuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, GuidanceText, Input } from "~tracer-web/shared/ui/index.js";
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
    <div className="py-4 px-4 pb-3 border-b border-hair bg-canvas sm:px-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-lg font-semibold text-ink">Recipes</div>
          <GuidanceText
            as="div"
            className="text-xs text-ink-muted mt-1 max-w-[720px]"
            locale={guidance.locale}
            message={guidance.messages.recipes.introduction}
          />
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto">
          <span className="shrink-0 text-[11px] text-ink-muted uppercase tracking-[0.06em]">Task</span>
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
        </div>
        <Input
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="What should the recipe capture?"
          className="w-full min-w-0 flex-1 sm:min-w-[260px]"
          disabled={isScanning}
        />
        <div className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto">
          <span className="shrink-0 text-[11px] text-ink-muted uppercase tracking-[0.06em]">Backend</span>
          <AgentBackendSelect
            value={agentBackend}
            onChange={onAgentBackendChange}
            disabled={isScanning}
            className="min-w-0 flex-1 sm:min-w-[154px]"
          />
        </div>
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
          className={cn("w-full sm:w-auto", isScanning && "bg-s2 text-ink-subtle")}
        >
          {isScanning ? "Scanning…" : "Scan now"}
        </Button>
        {latestJob && (
          <span className="text-[11.5px] text-ink-muted">
            Last scan: {latestJob.status}
            {latestJob.status === "completed" && (
              <>
                {" "}
                · {latestJob.recipes.length} candidate
                {latestJob.recipes.length === 1 ? "" : "s"}
                {latestJob.taskId ? ` · ${latestJob.taskId.slice(0, 8)}` : ""}
              </>
            )}
          </span>
        )}
      </div>
      {failureMessage && (
        <div className="mt-2 text-xs py-1.5 px-2.5 rounded-sm bg-err/8 text-err">
          {isGuidanceMessage(failureMessage) ? (
            <GuidanceText locale={guidance.locale} message={failureMessage} />
          ) : (
            failureMessage
          )}
        </div>
      )}
    </div>
  );
}
