// task 문서는 사용자마다 다른 문서이므로 검색 문서 ID도 (userId, taskId) 복합 키를 그대로 실어야 한다.
export function taskDocumentId(userId: string, taskId: string): string {
    return JSON.stringify([userId, taskId]);
}
