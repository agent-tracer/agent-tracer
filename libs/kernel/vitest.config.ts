import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths({ root: "../.." })],
  esbuild: { target: "es2022" },
  test: {
    name: "kernel",
    include: ["src/**/*.test.ts"],
  },
});
