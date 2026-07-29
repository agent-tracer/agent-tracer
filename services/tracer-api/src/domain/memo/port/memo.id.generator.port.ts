export const MEMO_ID_GENERATOR = Symbol("MEMO_ID_GENERATOR");

export interface MemoIdGeneratorPort {
    next(): string;
}
