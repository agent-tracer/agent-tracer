import type { LedgerRecord } from "~tracer-api/support/ledger.record.js";

/** 배포 프로파일의 CDC 메시지가 서던 자리를 대신해 원장을 seq 순서로 읽는 창구다. */
export interface LedgerSource {
    /** 커서보다 큰 seq를 오름차순으로 최대 limit건 읽는다. */
    readAfter(seq: number, limit: number): Promise<readonly LedgerRecord[]>;
}

/** 어디까지 투영했는지를 재기동 사이에 남기는 창구다. */
export interface ProjectionCursorStore {
    read(name: string): Promise<number>;
    write(name: string, seq: number): Promise<void>;
}
