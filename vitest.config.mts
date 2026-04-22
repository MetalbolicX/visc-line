import { defineConfig } from "vitest/config";

export default defineConfig({
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
  },
});