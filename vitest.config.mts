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
      thresholds: {
        branches: 79,
        functions: 89,
        lines: 87,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.mts"],
    setupFiles: ["./vitest.setup.mts"],
  },
});