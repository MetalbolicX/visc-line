"use strict";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.mts",
  format: ["cjs", "es", "umd"],
  platform: "browser",
  minify: true,
  dts: true,
  deps: {
    alwaysBundle: ["tipviz"],
  },
  tsconfig: true,
  outDir: "./dist",
  fixedExtension: true,
  outputOptions: {
    name: "ViscLine",
    globals: {
      d3: "d3",
    },
  },
});
