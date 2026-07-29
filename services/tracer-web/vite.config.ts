import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { federation } from "@module-federation/vite";
import { resolveViteMonitorConfig } from "./src/shared/config/vite-monitor-config.js";

// 연합 리모트가 원격 진입점으로 고정해 쓰는 경로다.
const AGENT_REMOTE_MOUNT_PATH = "/remote/agent";

const PACKAGE_ROOT = fileURLToPath(new URL(".", import.meta.url));

// exports 필드만 있고 main이 없는 패키지라 리터럴 스펙 대신 조립한 문자열로 런타임에만 불러온다.
const TAILWIND_VITE_PLUGIN_SPECIFIER = ["@tailwindcss", "vite"].join("/");

interface TailwindVitePluginModule {
  readonly default: () => PluginOption;
}

// packages/runtime의 ~/.agent-tracer/resume.token(0600)과 같은 경로 규약을 읽는다.
function readLocalResumeToken(): string {
  try {
    return readFileSync(join(homedir(), ".agent-tracer", "resume.token"), "utf8").trim();
  } catch {
    return "";
  }
}

export default defineConfig(async ({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  const {
    monitorHttpBaseUrl,
    monitorWsBaseUrl,
    webApiBaseUrl,
    webWsBaseUrl,
    resumeHelperBaseUrl,
  } = resolveViteMonitorConfig(env);
  const isVitest = process.env["VITEST"] === "true" || mode === "test";
  const plugins: PluginOption[] = [react(), tsconfigPaths({ root: "../.." })];
  if (!isVitest) {
    const { default: tailwindcss } = (await import(
      TAILWIND_VITE_PLUGIN_SPECIFIER
    )) as TailwindVitePluginModule;
    plugins.push(tailwindcss());
    // 다섯 라이브러리가 두 인스턴스로 갈라지면 훅과 컨텍스트와 캐시가 조용히 깨진다.
    plugins.push(federation({
      name: "tracerWeb",
      filename: "remoteEntry.js",
      dts: false,
      exposes: {
        "./ui": "./src/shared/ui/index.ts",
        "./store": "./src/shared/store/index.ts",
        "./api": "./src/shared/api/index.ts",
        "./guidance": "./src/shared/guidance.ts",
        "./entities": "./src/entities/index.ts",
      },
      // 리모트는 URL이 배포마다 다르므로 정적으로 선언하지 않고 remote/에서 실행 시점에 등록한다.
      shared: {
        react: { singleton: true, requiredVersion: false },
        "react-dom": { singleton: true, requiredVersion: false },
        "react-router-dom": { singleton: true, requiredVersion: false },
        "@tanstack/react-query": { singleton: true, requiredVersion: false },
        zustand: { singleton: true, requiredVersion: false },
      },
    }));
  }
  return {
    plugins,
    define: {
      "import.meta.env.VITE_MONITOR_BASE_URL": JSON.stringify(webApiBaseUrl),
      "import.meta.env.VITE_MONITOR_WS_BASE_URL": JSON.stringify(webWsBaseUrl),
      "import.meta.env.VITE_MONITOR_DEV_BASE_URL": JSON.stringify(monitorHttpBaseUrl),
      "import.meta.env.VITE_MONITOR_DEV_WS_BASE_URL": JSON.stringify(monitorWsBaseUrl),
      "import.meta.env.VITE_AGENT_TRACER_RESUME_BASE_URL": JSON.stringify(resumeHelperBaseUrl),
      "import.meta.env.VITE_AGENT_TRACER_RESUME_TOKEN": JSON.stringify(readLocalResumeToken()),
    },
    build: {
      // 연합이 공유 의존성을 비동기 초기화 래퍼로 감싸므로 청크 구성은 federation 플러그인이 갖는다.
      target: "esnext",
    },
    server: {
      proxy: {
        "/api": monitorHttpBaseUrl,
        "/health": monitorHttpBaseUrl,
        "/ws": {
          target: monitorWsBaseUrl,
          ws: true,
        },
        // 값이 없으면 프록시가 없으니 remoteEntry는 자연스럽게 404이고 호스트는 그대로 돈다.
        ...(env["AGENT_REMOTE_URL"]
          ? {
              [AGENT_REMOTE_MOUNT_PATH]: {
                target: env["AGENT_REMOTE_URL"],
                changeOrigin: true,
                rewrite: (path: string) => path.replace(AGENT_REMOTE_MOUNT_PATH, ""),
              },
            }
          : {}),
      },
    },
    test: {
      name: "tracer-web",
      environment: "jsdom",
      setupFiles: [join(PACKAGE_ROOT, "vitest-setup.config.ts")],
      css: false,
      restoreMocks: true,
      testTimeout: 20_000,
    },
  };
});
