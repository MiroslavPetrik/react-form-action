import { defineConfig } from "tsup";

export default defineConfig({
  name: "react-form-action",
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  external: ["react-dom"],
});
