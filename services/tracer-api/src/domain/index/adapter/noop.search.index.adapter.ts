import { Injectable } from "@nestjs/common";
import type {
    SearchBulkOperation,
    SearchIndexWriterPort,
} from "~tracer-api/domain/index/port/search.index.writer.port.js";

/** 전문 검색을 끈 로컬 프로파일에서 아웃박스 행이 배출돼 지워지도록 쓰기를 받아들이기만 한다. */
@Injectable()
export class NoopSearchIndexAdapter implements SearchIndexWriterPort {
    ensureIndex(): Promise<void> {
        return Promise.resolve();
    }

    writeBulk(
        operations: readonly SearchBulkOperation[],
    ): Promise<{ readonly errors: boolean; readonly itemCount: number }> {
        return Promise.resolve({ errors: false, itemCount: operations.length });
    }

    indexDocument(): Promise<void> {
        return Promise.resolve();
    }

    updateDocument(): Promise<void> {
        return Promise.resolve();
    }

    deleteDocument(): Promise<void> {
        return Promise.resolve();
    }
}
