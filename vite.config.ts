import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
    },
    rollupOptions: {
      external: [
        "vite",
        "node:child_process",
        "node:fs",
        "node:path",
        "node:os",
      ],
      output: {
        exports: "named",
      },
    },
  },
  plugins: [dts()],
});
