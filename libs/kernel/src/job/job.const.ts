export const JOB_KIND = {
    titleSuggestion: "title.suggestion",
    recipeScan: "recipe.scan",
    taskCleanup: "task.cleanup",
} as const;

export type JobKind = (typeof JOB_KIND)[keyof typeof JOB_KIND];

// 레시피 스캔을 요청한 표면이며 앵커 자격 판정이 여기서 갈린다.
export const RECIPE_SCAN_TRIGGER = {
    dashboard: "dashboard",
    session: "session",
} as const;

export type RecipeScanTrigger = (typeof RECIPE_SCAN_TRIGGER)[keyof typeof RECIPE_SCAN_TRIGGER];

export const JOB_EXECUTOR = {
    [JOB_KIND.titleSuggestion]: "temporal",
    [JOB_KIND.recipeScan]: "temporal",
    [JOB_KIND.taskCleanup]: "temporal",
} as const satisfies Record<JobKind, "temporal" | "local">;

export type JobExecutor = (typeof JOB_EXECUTOR)[JobKind];

export const JOB_STATUS = {
    pending: "pending",
    running: "running",
    completed: "completed",
    failed: "failed",
    canceled: "canceled",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUSES: readonly JobStatus[] = Object.values(JOB_STATUS);

// canceled를 종료 상태에 포함해야 워커의 종결 가드가 취소된 잡을 덮어쓰지 않는다.
export function isTerminalJobStatus(status: JobStatus): boolean {
    return (
        status === JOB_STATUS.completed || status === JOB_STATUS.failed || status === JOB_STATUS.canceled
    );
}

// 대기·실행 중인 잡만 취소할 수 있다.
export function isCancelableJobStatus(status: JobStatus): boolean {
    return status === JOB_STATUS.pending || status === JOB_STATUS.running;
}

// 로컬 실행기가 잡을 쥐고 있음을 알리는 리스의 수명이며 하트비트가 이보다 잦아야 한다.
