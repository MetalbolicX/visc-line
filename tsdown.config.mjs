"use strict";
import { defineConfig } from "tsdown";

const shared = {
  deps: {
    alwaysBundle: ["tipviz"],
  },
  fixedExtension: true,
  minify: true,
  platform: "browser",
  sourcemap: true,
  tsconfig: true,
};

export default [
  defineConfig({
    ...shared,
    clean: true,
    dts: true,
    entry: "./src/index.mts",
    format: ["cjs", "es", "umd"],
    outDir: "./dist",
    outputOptions: {
      globals: {
        d3: "d3",
      },
      name: "ViscLine",
    },
  }),
  defineConfig({
    ...shared,
    dts: true,
    entry: "./src/internal.mts",
    format: ["cjs", "es"],
    outDir: "./dist",
  }),
];
