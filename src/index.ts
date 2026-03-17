import { type ChildProcess, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { build } from "vite";

export interface HugoPluginOptions {
  hugoBin?: string;
  outDir?: string;
  watch?: string;
  hugoArgs?: string[];
}

export function hugoPlugin(options: HugoPluginOptions = {}): Plugin {
  const { 
    hugoBin, 
    hugoArgs = ["server", "--ignoreCache", "--noHTTPCache"],
    outDir = "./static/assets",
  } = options;

  let isServe = false;
  let hugoProcess: ChildProcess;
  const tempDir = resolve(tmpdir(), "vite-plugin-hugo", "vite");

  return {
    name: "vite-plugin-hugo",

    // Configure Vite based on whether we're in serve or build mode
    config(_config, { command }) {
      isServe = command === "serve";

      // Dev mode: build to temp dir, then copy to static for Hugo to serve
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

      // Build mode: output directly to static folder
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

    // Start Hugo server when Vite dev server starts
    async configureServer(server) {
      // Spawn Hugo server with cache disabled to ensure fresh builds
      hugoProcess = spawn(
        hugoBin ?? "hugo",
        hugoArgs,
        {
          stdio: "inherit",
        },
      );

      // Clean up Hugo process when Vite dev server stops
      server.httpServer?.once("close", () => hugoProcess?.kill());

      // Copy built assets from temp dir to Hugo's static folder
      const copyFiles = () => {
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

          // Remove existing file before copying to ensure fresh content
          if (existsSync(outputPath)) {
            rmSync(outputPath, { force: true, recursive: true });
          }

          const outputDir = dirname(outputPath);
          if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
          }

          cpSync(sourcePath, outputPath);
        }
      };

      // Run initial build and copy files
      const runBuild = async () => {
        // Clean temp dir to avoid stale files
        if (existsSync(tempDir)) {
          rmSync(tempDir, { force: true, recursive: true });
        }
        mkdirSync(tempDir, { recursive: true });

        // Build assets to temp dir
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

        // Copy built assets to Hugo's static folder
        copyFiles();
      };

      await runBuild();

      // Rebuild on file changes in src/
      server.watcher.on("change", async (filePath) => {
        if (!filePath.includes("/src/")) return;
        await runBuild();
      });
    },
  };
}

export default hugoPlugin;
