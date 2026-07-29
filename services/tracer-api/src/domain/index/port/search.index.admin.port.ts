import type { SearchIndexDefinition } from "~tracer-api/domain/index/model/search.index.definitions.js";

/** 물리 인덱스 생성과 alias 전환, 리인덱스를 수행하는 포트다. */
export interface SearchIndexAdminPort {
    ensureIndex(definition: SearchIndexDefinition, attachAlias: boolean): Promise<void>;
    resolveAlias(alias: string): Promise<readonly string[]>;
    reindex(sourceIndex: string, targetIndex: string): Promise<void>;
    count(index: string): Promise<number>;
    swapAlias(alias: string, sourceIndex: string, targetIndex: string): Promise<void>;
}
