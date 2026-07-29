import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { MONITOR_USER_HEADER } from "@agent-tracer/kernel";
import { issueAuthToken, issueExecutionScopeToken } from "@agent-tracer/platform";
import { AuthGuard } from "./auth.guard.js";

function setEnv(key: string, value: string | undefined): void {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
}

const openReflector = { getAllAndOverride: () => undefined } as unknown as Reflector;

function contextOf(headers: Record<string, string>): ExecutionContext {
    const request = { method: "GET", path: "/api/v1/tasks", headers };
    return {
        getType: () => "http",
        getHandler: () => undefined,
        getClass: () => undefined,
        switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
}

function headersOf(context: ExecutionContext): Record<string, string> {
    return context.switchToHttp().getRequest<{ headers: Record<string, string> }>().headers;
}

describe("AuthGuard 실행 범위 토큰", () => {
    const original = {
        mode: process.env["MONITOR_AUTH_MODE"],
        secret: process.env["MONITOR_AUTH_TOKEN_SECRET"],
    };
    const guard = new AuthGuard(openReflector);

    beforeEach(() => {
        setEnv("MONITOR_AUTH_MODE", "token");
        setEnv("MONITOR_AUTH_TOKEN_SECRET", "s3cret");
    });
    afterEach(() => {
        setEnv("MONITOR_AUTH_MODE", original.mode);
        setEnv("MONITOR_AUTH_TOKEN_SECRET", original.secret);
    });

    function scopeToken(userId: string): string {
        return issueExecutionScopeToken({ userId, executionId: "exec-1", ttlMs: 60_000, now: new Date() })!;
    }

    it("토큰이 담은 사용자가 자기신고 헤더를 이긴다", () => {
        const context = contextOf({
            authorization: `Bearer ${scopeToken("owner")}`,
            [MONITOR_USER_HEADER]: "someone-else",
        });

        expect(guard.canActivate(context)).toBe(true);
        expect(headersOf(context)[MONITOR_USER_HEADER]).toBe("owner");
    });

    it("인증을 강제하지 않는 환경에서도 토큰이 헤더를 이긴다", () => {
        const token = scopeToken("owner");
        setEnv("MONITOR_AUTH_MODE", undefined);
        const context = contextOf({
            authorization: `Bearer ${token}`,
            [MONITOR_USER_HEADER]: "someone-else",
        });

        expect(guard.canActivate(context)).toBe(true);
        expect(headersOf(context)[MONITOR_USER_HEADER]).toBe("owner");
    });

    it("범위 토큰 모양인데 서명이 어긋나면 다른 신원으로 되돌아가지 않고 막는다", () => {
        const [prefix, payload] = scopeToken("owner").split(".");
        const context = contextOf({
            authorization: `Bearer ${prefix}.${payload}.forged`,
            [MONITOR_USER_HEADER]: "someone-else",
        });

        expect(() => guard.canActivate(context)).toThrow();
    });

    it("범위 토큰이 없으면 기존 베어러 인증이 그대로 신원을 정한다", () => {
        const bearer = issueAuthToken({ userId: "daemon", purpose: "api", ttlMs: 60_000, now: new Date() });
        const context = contextOf({ authorization: `Bearer ${bearer}` });

        expect(guard.canActivate(context)).toBe(true);
        expect(headersOf(context)[MONITOR_USER_HEADER]).toBe("daemon");
    });
});
