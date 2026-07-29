import { DEFAULT_USER_ID } from "@agent-tracer/kernel";

export function resolveUserId(header: string | undefined): string {
    const trimmed = header?.trim();
    return trimmed !== undefined && trimmed.length > 0 ? trimmed : DEFAULT_USER_ID;
}
