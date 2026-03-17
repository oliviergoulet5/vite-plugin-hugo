import { type ChildProcess, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { build } from "vite";

export interface HugoPluginOptions {
  hugoBin?: string;
  outDir?: string;
  watch?: string;
  hugoArgs?: string[];
}

/**
 * Vite plugin for Hugo static site generator.
 * Builds assets to a temporary directory during development and copies them
 * to Hugo's static folder, then rebuilds on file changes.
 *
 * @param options - Plugin configuration options
 * @returns Vite plugin instance
 */
export function hugoPlugin(options: HugoPluginOptions = {}): Plugin {
  const {
    hugoBin,
    hugoArgs = ["server", "--ignoreCache", "--noHTTPCache"],
    outDir = "./static/assets",
  } = options;

  let isServe = false;
  const tempDir = resolve(tmpdir(), "vite-plugin-hugo", "vite");

  return {
    name: "vite-plugin-hugo",

    config(_config, { command }) {
      isServe = command === "serve";

      if (isServe) {
        return {
          logLevel: "warn",
          server: {
            fs: { allow: [".."] },
          },
          build: {
            outDir: tempDir,
            emptyOutDir: true,
            rollupOptions: {
              input: "./src/main.ts",
              output: {
                entryFileNames: "[name].js",
                assetFileNames: "[name][extname]",
              },
            },
          },
        };
      }

      return {
        build: {
          outDir,
          rollupOptions: {
            input: "./src/main.ts",
            output: {
              entryFileNames: "[name].js",
              assetFileNames: "[name][extname]",
            },
          },
        },
      };
    },

    async configureServer(server) {
      const hugoProcess = startHugoServer(hugoBin, hugoArgs);
      setupCleanupOnServerClose(server, hugoProcess);

      await runBuild(tempDir, outDir);
      setupFileWatcher(server, tempDir, outDir);
    },
  };
}

/**
 * Spawns the Hugo server process.
 *
 * @param hugoBin - Path to Hugo binary
 * @param hugoArgs - Arguments to pass to Hugo
 * @returns The spawned Hugo process
 */
function startHugoServer(
  hugoBin: string | undefined,
  hugoArgs: string[],
): ChildProcess {
  return spawn(hugoBin ?? "hugo", hugoArgs, {
    stdio: "inherit",
  });
}

/**
 * Sets up cleanup to kill Hugo process when the Vite server closes.
 *
 * @param server - The Vite dev server
 * @param hugoProcess - The Hugo process to kill on close
 */
function setupCleanupOnServerClose(
  server: ViteDevServer,
  hugoProcess: ChildProcess,
): void {
  server.httpServer?.once("close", () => hugoProcess?.kill());
}

/**
 * Builds the project assets and copies them to Hugo's static folder.
 *
 * @param tempDir - Temporary directory for building assets
 * @param outDir - Target directory in Hugo's static folder
 */
async function runBuild(tempDir: string, outDir: string): Promise<void> {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { force: true, recursive: true });
  }
  mkdirSync(tempDir, { recursive: true });

  await build({
    root: process.cwd(),
    build: {
      outDir: tempDir,
      emptyOutDir: true,
      assetsDir: ".",
      rollupOptions: {
        input: resolve(process.cwd(), "src/main.ts"),
        output: {
          entryFileNames: "[name].js",
          assetFileNames: "[name][extname]",
        },
      },
    },
  });

  copyAssets(tempDir, outDir);
}

/**
 * Sets up a file watcher to rebuild on changes to source files.
 * Uses debouncing to prevent rapid successive builds.
 *
 * @param server - The Vite dev server
 * @param tempDir - Temporary directory for building assets
 * @param outDir - Target directory in Hugo's static folder
 */
function setupFileWatcher(
  server: ViteDevServer,
  tempDir: string,
  outDir: string,
): void {
  let debounceTimer: NodeJS.Timeout | null = null;

  server.watcher.on("change", async (filePath) => {
    if (!filePath.includes("/src/")) return;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      await runBuild(tempDir, outDir);
    }, 300);
  });
}

/**
 * Copies built assets from the temporary directory to Hugo's static folder.
 *
 * @param tempDir - Source directory containing built assets
 * @param outDir - Target directory in Hugo's static folder
 */
function copyAssets(tempDir: string, outDir: string): void {
  const targetDir = resolve(process.cwd(), outDir);
  const sourceDir = resolve(tempDir, "assets");

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  if (!existsSync(sourceDir)) return;

  for (const fileName of ["main.js", "main.css"]) {
    const sourcePath = resolve(sourceDir, fileName);
    const outputPath = resolve(targetDir, fileName);

    if (!existsSync(sourcePath)) continue;

    if (existsSync(outputPath)) {
      rmSync(outputPath, { force: true, recursive: true });
    }

    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    cpSync(sourcePath, outputPath);
  }
}

export default hugoPlugin;
