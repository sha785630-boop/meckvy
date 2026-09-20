#!/usr/bin/env node
/**
 * Packs extension/linkshield into public/linkshield-extension.zip
 * for one-click download on the install page.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const src = path.join(root, "extension", "linkshield");
const outDir = path.join(root, "public");
const outZip = path.join(outDir, "linkshield-extension.zip");

if (!fs.existsSync(src)) {
  console.error("Missing extension/linkshield");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

execSync(`cd "${path.join(root, "extension")}" && zip -r "${outZip}" linkshield -x "*.DS_Store"`, {
  stdio: "inherit",
});

console.log("Wrote", outZip);
