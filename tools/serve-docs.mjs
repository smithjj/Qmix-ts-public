import { createServer as http } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT) || 3002;
const rootPath = normalize(fileURLToPath(new URL("../typedoc-api/", import.meta.url)));

const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

http((req, res) => {
  const url = req.url === "/" ? "/index.html" : req.url;
  const file = normalize(join(rootPath, url));
  if (!file.startsWith(rootPath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const data = readFileSync(file);
    const ext = extname(url);
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => console.log(`Docs at http://localhost:${port}`));
