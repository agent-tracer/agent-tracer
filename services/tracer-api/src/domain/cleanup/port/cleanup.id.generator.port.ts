export const CLEANUP_ID_GENERATOR = Symbol("CLEANUP_ID_GENERATOR");

export interface CleanupIdGeneratorPort {
    next(): string;
}
