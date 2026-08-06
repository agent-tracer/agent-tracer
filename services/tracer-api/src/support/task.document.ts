import type { TaskEntity } from "@agent-tracer/tracer-model";

/** 읽기 모델의 태스크 행을 검색 문서로 옮기며, 원장 재구축 경로가 쓰는 필드를 모두 담아 전체 색인으로 덮어도 값을 잃지 않는다. */
export function buildTaskDocument(task: TaskEntity, archived: boolean): Record<string, unknown> {
    const doc: Record<string, unknown> = {
        userId: task.userId,
        taskId: task.id,
        title: task.title,
        status: task.status,
        taskKind: task.taskKind,
        origin: task.origin,
        archived,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
    if (task.workspacePath !== null) doc["workspacePath"] = task.workspacePath;
    if (task.lastEventAt !== null) doc["lastEventAt"] = task.lastEventAt.toISOString();
    return doc;
}
