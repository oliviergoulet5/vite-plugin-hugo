import type { Plugin } from "vite";

export interface HugoPluginOptions {
  watch?: boolean;
}

export function hugoPlugin(options: HugoPluginOptions = {}): Plugin {
  const { watch = true } = options;

  return {
    name: "vite-plugin-hugo",
    config(_config, { command }) {
      if (command === "serve") {
        return {
          server: {
            fs: {
              allow: [".."],
            },
          },
          build: {
            watch: watch ? {} : null,
            outDir: "public/assets",
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
          outDir: "public/assets",
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
  };
}

export default hugoPlugin;
