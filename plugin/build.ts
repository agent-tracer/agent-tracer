/** 설치된 플러그인에는 node_modules가 없으므로 훅과 데몬을 node로 바로 실행되는 단일 파일로 번들한다. */
import {mkdir, readdir, rm} from "node:fs/promises";
import * as path from "node:path";
import {build, type BuildOptions} from "esbuild";

const pluginRoot = import.meta.dirname;
const hooksDir = path.join(pluginRoot, "src/agent/claude-code/hooks");
const hooksOutdir = path.join(pluginRoot, "dist/agent/claude-code/hooks");
const daemonEntry = path.join(pluginRoot, "src/daemon/main.ts");
const daemonOutdir = path.join(pluginRoot, "dist/daemon");
const mcpEntry = path.join(pluginRoot, "src/agent/claude-code/mcp/server.ts");
const mcpOutdir = path.join(pluginRoot, "dist/agent/claude-code/mcp");

const common: BuildOptions = {
    bundle: true,
    platform: "node",
    target: "node24",
    format: "esm",
    sourcemap: false,
    tsconfig: path.join(pluginRoot, "tsconfig.plugin.json"),
    alias: {
        "~plugin": path.join(pluginRoot, "src"),
        "~kernel": path.join(pluginRoot, "../libs/kernel/src"),
        "@agent-tracer/kernel": path.join(pluginRoot, "../libs/kernel/src"),
    },
    logLevel: "info",
};

async function hookEntrypoints(): Promise<string[]> {
    const entries = await readdir(hooksDir, {withFileTypes: true});
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts"))
        .map((entry) => path.join(hooksDir, entry.name))
        .sort();
}

async function emptyDir(dir: string): Promise<void> {
    await rm(dir, {recursive: true, force: true});
    await mkdir(dir, {recursive: true});
}

await emptyDir(hooksOutdir);
const entryPoints = await hookEntrypoints();
await build({...common, entryPoints, outbase: hooksDir, outdir: hooksOutdir});
process.stdout.write(`[plugin-build] hooks: ${entryPoints.length} entries -> ${hooksOutdir}\n`);

await emptyDir(daemonOutdir);
await build({...common, entryPoints: [daemonEntry], outbase: path.dirname(daemonEntry), outdir: daemonOutdir});
process.stdout.write(`[plugin-build] daemon: 1 entry -> ${daemonOutdir}\n`);

await emptyDir(mcpOutdir);
await build({...common, entryPoints: [mcpEntry], outbase: path.dirname(mcpEntry), outdir: mcpOutdir});
process.stdout.write(`[plugin-build] mcp: 1 entry -> ${mcpOutdir}\n`);
