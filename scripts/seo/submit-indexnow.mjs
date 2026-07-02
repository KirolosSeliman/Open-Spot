import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const urlsFile = join(__dirname, "../../docs/seo/indexing-urls.txt");
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function readIndexingUrls() {
  const raw = readFileSync(urlsFile, "utf8");

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function maskKey(key) {
  if (key.length <= 8) {
    return "****";
  }

  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function main() {
  const key = process.env.INDEXNOW_KEY?.trim();
  const host = process.env.INDEXNOW_HOST?.trim() || "open-spot.ca";
  const keyLocation =
    process.env.INDEXNOW_KEY_LOCATION?.trim() || `https://${host}/${key}.txt`;

  if (!key) {
    console.error("INDEXNOW_KEY is missing. Set it in your local shell environment.");
    process.exit(1);
  }

  const urlList = readIndexingUrls();

  if (urlList.length === 0) {
    console.error("No URLs found in docs/seo/indexing-urls.txt");
    process.exit(1);
  }

  const payload = {
    host,
    key,
    keyLocation,
    urlList
  };

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `IndexNow submission failed (${response.status}) for key ${maskKey(key)}: ${body}`
    );
    process.exit(1);
  }

  console.log(`IndexNow submission accepted for ${urlList.length} URL(s) using key ${maskKey(key)}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "IndexNow submission failed.");
  process.exit(1);
});
