#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "src");

const DRY = process.argv.includes("--dry-run");

function isMts(file) {
  return file.endsWith(".mts");
}
function isMjs(file) {
  return file.endsWith(".mjs");
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

function extractFirstJsDoc(text) {
  const m = text.match(/\/\*\*[\s\S]*?\*\//);
  return m ? m[0] : null;
}

async function main() {
  try {
    const allFiles = await walk(srcDir);
    const mtsFiles = allFiles.filter(isMts);
    if (mtsFiles.length === 0) {
      console.error("No .mts files found under", srcDir);
      process.exit(1);
    }

    for (const mtsFile of mtsFiles) {
      const mjsFile = mtsFile.replace(/\.mts$/, ".mjs");
      let exists = true;
      try {
        await fs.access(mjsFile);
      } catch {
        exists = false;
      }
      if (!exists) {
        console.warn("Skipping, no matching .mjs:", mjsFile);
        continue;
      }

      const mtsText = await fs.readFile(mtsFile, "utf8");
      const newJsDoc = extractFirstJsDoc(mtsText);
      if (!newJsDoc) {
        console.warn("No JSDoc found in", mtsFile);
        continue;
      }

      const mjsText = await fs.readFile(mjsFile, "utf8");
      const oldJsDoc = extractFirstJsDoc(mjsText);
      let merged;
      if (oldJsDoc) {
        merged = mjsText.replace(oldJsDoc, newJsDoc);
      } else {
        merged = newJsDoc + "\n" + mjsText;
      }

      if (merged === mjsText) {
        console.log("No change needed for", mjsFile);
        continue;
      }

      if (DRY) {
        console.log(`[DRY] Would update: ${mjsFile}`);
      } else {
        await fs.writeFile(mjsFile, merged, "utf8");
        console.log("Updated", mjsFile);
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
