"use strict";
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Map '@' to the 'src' directory
      "@": resolve(new URL("./src", import.meta.url).pathname),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
