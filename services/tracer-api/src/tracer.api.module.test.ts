import { describe, expect, it } from "vitest";
import type { Provider } from "@nestjs/common";
import { ProjectorModule, type ProjectorDeps } from "./projector.module.js";
import { TracerApiModule } from "./tracer.api.module.js";

// vitest는 vite의 import.meta.glob을 제공하지만 이 패키지 tsconfig에는 vite 타입이 없다.
type GlobbingImportMeta = ImportMeta & {
    glob(pattern: string, options: { eager: true }): Record<string, Record<string, unknown>>;
};

const portModules = (import.meta as GlobbingImportMeta).glob("./domain/**/*.port.ts", { eager: true });

function providedTokens(providers: readonly Provider[]): ReadonlySet<unknown> {
    return new Set(providers.map((p) => (typeof p === "object" && "provide" in p ? p.provide : p)));
}

function declaredPortTokens(): ReadonlyMap<symbol, string> {
    const tokens = new Map<symbol, string>();
    for (const [file, exports] of Object.entries(portModules)) {
        for (const [name, value] of Object.entries(exports)) {
            if (typeof value === "symbol") tokens.set(value, `${file} → ${name}`);
        }
    }
    return tokens;
}

function tokenName(token: unknown): string {
    if (typeof token === "symbol") return token.toString();
    if (typeof token === "function") return token.name;
    return String(token);
}

function injectedTokens(provider: Provider): readonly unknown[] {
    const inject = (provider as { inject?: readonly unknown[] }).inject;
    if (inject === undefined) return [];
    // 선택 의존은 토큰을 한 겹 감싸므로 벗겨서 같은 자리에 놓는다.
    return inject.map((dep) => {
        const optional = dep as { token?: unknown };
        return typeof dep === "object" && dep !== null && optional.token !== undefined ? optional.token : dep;
    });
}

describe("TracerApiModule", () => {
    it("팩토리가 주입받는 토큰을 모두 배선한다", () => {
        const module = TracerApiModule.forRoot(undefined as never, undefined as never, undefined as never);
        const providers = module.providers ?? [];
        const provided = providedTokens(providers);

        const unresolved = providers.flatMap((provider) =>
            injectedTokens(provider)
                .filter((token) => !provided.has(token))
                .map((token) => `${tokenName((provider as { provide: unknown }).provide)} ← ${tokenName(token)}`),
        );

        expect(unresolved).toEqual([]);
    });
});

describe("tracer-api의 두 진입 모듈", () => {
    it("application 포트가 선언한 주입 토큰을 남김없이 배선한다", () => {
        const api = TracerApiModule.forRoot(undefined as never, undefined as never, undefined as never);
        const projector = ProjectorModule.forRoot({ otlp: {} } as unknown as ProjectorDeps);
        const provided = providedTokens([...api.providers ?? [], ...projector.providers ?? []]);

        const unwired = [...declaredPortTokens()]
            .filter(([token]) => !provided.has(token))
            .map(([, where]) => where);

        expect(unwired).toEqual([]);
    });
});
