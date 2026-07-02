import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const urlsFile = join(__dirname, "../../docs/seo/indexing-urls.txt");

const raw = readFileSync(urlsFile, "utf8");

for (const line of raw.split("\n")) {
  const trimmed = line.trim();

  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    continue;
  }

  console.log(trimmed);
}
