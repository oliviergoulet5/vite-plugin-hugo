import { defineConfig } from "vite";
import hugoPlugin from "../src/index";

export default defineConfig({
  plugins: [hugoPlugin()],
});
