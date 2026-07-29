import type {CreateMemoUsecase} from "~plugin/domain/memo/application/create.memo.usecase.js";
import type {SearchMemosInput, SearchMemosUsecase} from "~plugin/domain/memo/application/search.memos.usecase.js";
import type {MemoSearchResultItem} from "~plugin/domain/memo/port/memo.search.port.js";
import type {MemoWriteInput} from "~plugin/domain/memo/port/memo.write.port.js";
import type {Fetched} from "~plugin/support/fetched.js";

/** 메모 도메인이 어댑터에 제공하는 진입점 묶음이다. */
export interface MemoHook {
    readonly createMemo: CreateMemoUsecase;
    readonly searchMemos: SearchMemosUsecase;
}

export function onMemoCreateRequested(hook: MemoHook, input: MemoWriteInput): Promise<boolean> {
    return hook.createMemo.execute(input);
}

export function onMemoSearchRequested(hook: MemoHook, input: SearchMemosInput): Promise<Fetched<readonly MemoSearchResultItem[]>> {
    return hook.searchMemos.execute(input);
}
