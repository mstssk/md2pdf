import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { md2pdf } from "./index.js";

const { values, positionals } = parseArgs({
  options: { "config-file": { type: "string" } },
  allowPositionals: true,
});

const configFile = values["config-file"];
const [mdPath] = positionals;
if (!configFile || !mdPath) {
  throw new Error("Usage: md2pdf --config-file=<config.js> <input.md>");
}

const { default: config } = await import(
  pathToFileURL(path.resolve(configFile)).href
);
await md2pdf(mdPath, config);
