export const TAG_ID_GENERATOR = Symbol("TAG_ID_GENERATOR");

export interface TagIdGeneratorPort {
    next(): string;
}
