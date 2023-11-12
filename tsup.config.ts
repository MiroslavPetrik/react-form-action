import { defineConfig } from "tsup";

export default defineConfig({
  name: "react-form-action",
  entry: ["src/index.ts", "src/client.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  external: ["react", "react-dom"],
});
