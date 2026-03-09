// Patch vite-plugin-commonjs to skip airport-data-js's large minified bundle
// that causes stack overflow in the isCommonjs() regex.
import { readFileSync, writeFileSync } from "fs";

const filePath = "node_modules/vite-plugin-commonjs/dist/index.mjs";
let code = readFileSync(filePath, "utf8");

const original = `function isCommonjs(code) {
  code = code.replace(multilineCommentsRE, "").replace(singlelineCommentsRE, "");
  return /\\b(?:require|module|exports)\\b/.test(code);
}`;

const patched = `function isCommonjs(code) {
  // Skip very large files (>1MB) to avoid regex stack overflow
  if (code.length > 1048576) return false;
  code = code.replace(multilineCommentsRE, "").replace(singlelineCommentsRE, "");
  return /\\b(?:require|module|exports)\\b/.test(code);
}`;

if (code.includes(original)) {
  code = code.replace(original, patched);
  writeFileSync(filePath, code);
  console.log("Patched vite-plugin-commonjs to skip large files");
} else if (code.includes("Skip very large files")) {
  console.log("vite-plugin-commonjs already patched");
} else {
  console.warn("Could not find isCommonjs function to patch");
}
