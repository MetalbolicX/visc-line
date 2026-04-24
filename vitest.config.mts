import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ["src/**/*.test.mts"],
      include: ["src/**/*.mts"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.mts"],
    setupFiles: ["./vitest.setup.mts"],
  },
});