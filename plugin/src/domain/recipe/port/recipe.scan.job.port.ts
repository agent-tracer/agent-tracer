/** 레시피 스캔 잡을 서버 큐에 넣는다. */
export interface RecipeScanJobPort {
    hasActiveScan(taskId: string): Promise<boolean>;
    /** 이 잡을 접수하는 창구를 세우는 서비스가 배포에 있는지를 확인한다. */
    isAvailable(): Promise<boolean>;
    enqueue(taskId: string, idempotencyKey: string, userPrompt?: string): Promise<boolean>;
}
