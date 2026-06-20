import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join, normalize } from "node:path";

const docsDir = normalize(fileURLToPath(new URL("../typedoc-api/", import.meta.url)));
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

const server = createServer((req, res) => {
  const url = req.url === "/" ? "/index.html" : req.url;
  const file = join(docsDir, url);
  try {
    res.writeHead(200, { "Content-Type": mime[extname(url)] || "application/octet-stream" });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`Docs server on http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  async function checkModule(path, label, checks) {
    await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const text = await page.textContent("body");
    console.log(`\n${label}:`);
    for (const check of checks) {
      console.log(`  ${text.includes(check) ? "✓" : "✗"} "${check}"`);
    }
  }

  await checkModule("/modules/server.html", "Server module", [
    "Qmix web server", "GET /api/crystals", "POST /api/calculate", "customCrystals", "compare.html",
  ]);

  await checkModule("/modules/cli.html", "CLI module", [
    "Usage", "Basic usage", "JSON mode", "Custom crystals", "Example output", "Walkoff", "d_eff", "S_o * L",
  ]);

  await checkModule("/modules/qmix_engine.html", "Engine module", [
    "QmixEngine", "calculate", "registerUniaxialNlData", "registerBiaxialNlData",
  ]);

  await checkModule("/modules/qmix_crystal-db.html", "CrystalDB module", [
    "CrystalDB", "registerFromJson", "getRange",
  ]);

  await browser.close();
  server.close();
  process.exit(0);
});
