import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { issueAuthToken } from "./auth.token.js";
import {
    issueExecutionScopeToken,
    looksLikeExecutionScopeToken,
    verifyExecutionScopeToken,
} from "./execution.scope.token.js";

const NOW = new Date("2026-07-26T00:00:00.000Z");
const SCOPE = { userId: "u1", executionId: "exec-1" };

function setEnv(key: string, value: string | undefined): void {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
}

describe("실행 범위 토큰", () => {
    const original = process.env["MONITOR_AUTH_TOKEN_SECRET"];

    beforeEach(() => setEnv("MONITOR_AUTH_TOKEN_SECRET", "s3cret"));
    afterEach(() => setEnv("MONITOR_AUTH_TOKEN_SECRET", original));

    it("발급한 자격이 사용자와 실행을 함께 되돌려 준다", () => {
        const token = issueExecutionScopeToken({ ...SCOPE, ttlMs: 60_000, now: NOW })!;

        expect(verifyExecutionScopeToken(token, NOW)).toEqual(SCOPE);
    });

    it("실행이 끝나기를 기다리지 않고 수명이 지나면 스스로 만료한다", () => {
        const token = issueExecutionScopeToken({ ...SCOPE, ttlMs: 60_000, now: NOW })!;

        expect(verifyExecutionScopeToken(token, new Date(NOW.getTime() + 60_001))).toBeNull();
    });

    it("서명이 바뀐 자격은 받지 않는다", () => {
        const token = issueExecutionScopeToken({ ...SCOPE, ttlMs: 60_000, now: NOW })!;
        const [prefix, payload] = token.split(".");

        expect(verifyExecutionScopeToken(`${prefix}.${payload}.forged`, NOW)).toBeNull();
    });

    it("인증 베어러를 실행 범위 자격으로 바꿔 쓸 수 없다", () => {
        const bearer = issueAuthToken({ userId: "u1", purpose: "api", ttlMs: 60_000, now: NOW });

        expect(looksLikeExecutionScopeToken(bearer)).toBe(false);
        expect(verifyExecutionScopeToken(bearer, NOW)).toBeNull();
    });

    it("서명 비밀이 없으면 발급하지 않는다", () => {
        setEnv("MONITOR_AUTH_TOKEN_SECRET", undefined);

        expect(issueExecutionScopeToken({ ...SCOPE, ttlMs: 60_000, now: NOW })).toBeNull();
    });
});
