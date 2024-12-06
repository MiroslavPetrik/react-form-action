/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./setup.ts"],
    typecheck: {
      // https://github.com/vitest-dev/vitest/issues/5256#issuecomment-1980431555
      ignoreSourceErrors: true,
    },
  },
});
