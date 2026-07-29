/** 궤적 내보내기의 와이어 계약이며 서버와 대시보드가 같은 타입을 쓴다. */
export type OpenInferenceSpanKind = "AGENT" | "CHAIN" | "TOOL" | "LLM" | "RETRIEVER" | "UNKNOWN";

export interface OpenInferenceSpanRecord {
    readonly spanId: string;
    readonly parentSpanId?: string;
    readonly name: string;
    readonly kind: OpenInferenceSpanKind;
    readonly startTime: string;
    readonly attributes: Record<string, unknown>;
}

export interface OpenInferenceTaskExport {
    readonly taskId: string;
    readonly runtimeSource?: string;
    readonly spans: readonly OpenInferenceSpanRecord[];
}

// OpenInference 내보내기 형식은 스팬 묶음을 최상위 `openinference` 키 아래에 싣는다.
export interface TaskOpenInferenceResponse {
    readonly openinference: OpenInferenceTaskExport;
}
