import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mjsToMtsPlugin = () => ({
  name: "mjs-to-mts",
  resolveId(source: string) {
    if (source.endsWith(".mjs")) {
      const mtsPath = source.slice(0, -4) + ".mts";
      if (mtsPath.startsWith("@/")) {
        const relativePath = mtsPath.slice(2);
        return path.resolve(__dirname, "src", relativePath);
      }
      return mtsPath;
    }
    return null;
  },
});

export default defineConfig({
  plugins: [mjsToMtsPlugin()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ["src/**/*.test.mts"],
      include: ["src/**/*.mts"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Ratcheted to measured coverage 2026-09-05; up-only from here.
      thresholds: {
        branches: 59,
        functions: 85,
        lines: 79,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.mts"],
    setupFiles: ["./vitest.setup.mts"],
  },
});
