"use strict";
import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: ["tipviz"],
  },
  dts: true,
  entry: "./src/index.mts",
  fixedExtension: true,
  format: ["cjs", "es", "umd"],
  minify: true,
  outDir: "./dist",
  outputOptions: {
    globals: {
      d3: "d3",
    },
    name: "ViscLine",
  },
  platform: "browser",
  sourcemap: true,
  tsconfig: true,
});
