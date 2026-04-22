"use sctrict";

/* global window */
window.$docsify = {
  coverpage: true,
  executeScript:false,
  "flexible-alerts": {
    style: "flat"
  },
  loadSidebar: true,
  name: "visc-line",
  repo: "https://github.com/MetalbolicX/visc-line.git",
  search: {
    depth: 2,
    maxAge: 86400000, // 1 day
    noData: "No results found",
    paths: ["/api-reference"],
    placeholder: "Search...",
  },
  subMaxLevel: 3,
  tabs: {
    persist: true,
    sync: true,
    tabComments: true,
    tabHeadings: true,
    theme: "classic",
  }
};
