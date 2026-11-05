// Rebuild level-1/level-1-spark.pdf from the live Level 1 page and its print CSS.
// Usage: node scripts/build-level1-pdf.mjs
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const out = join(root, "level-1", "level-1-spark.pdf");
const chrome = process.env.CHROME || "google-chrome";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".mp4": "video/mp4",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = normalize(join(root, pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const { port } = server.address();
const page = `http://127.0.0.1:${port}/level-1/`;
const tmp = join(root, "level-1", ".level-1-spark.tmp.pdf");

try {
  await mkdir(join(root, "level-1"), { recursive: true });
  await rm(tmp, { force: true });
  const profile = mkdtempSync(join(tmpdir(), "level1-pdf-"));
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-pdf-header-footer",
    "--hide-scrollbars",
    `--user-data-dir=${profile}`,
    `--print-to-pdf=${tmp}`,
    "--virtual-time-budget=8000",
    page,
  ];
  const child = spawn(chrome, args, { stdio: "ignore" });
  const started = Date.now();
  try {
    await new Promise((resolveReady, reject) => {
      let settled = false;
      const finish = (fn) => {
        if (settled) return;
        settled = true;
        clearInterval(timer);
        fn();
      };
      const timer = setInterval(async () => {
        try {
          const info = await stat(tmp);
          if (info.size > 20000 && Date.now() - info.mtimeMs > 400) finish(resolveReady);
        } catch {
          // Chrome creates the file when printing finishes.
        }
        if (Date.now() - started > 20000) finish(() => reject(new Error("Timed out waiting for the Level 1 PDF")));
      }, 200);
      child.on("error", (error) => finish(() => reject(error)));
      child.on("exit", (code) => {
        if (code !== 0 && code !== null) finish(() => reject(new Error(`Chrome exited ${code}`)));
      });
    });
  } finally {
    if (!child.killed) child.kill("SIGKILL");
    await rm(profile, { recursive: true, force: true });
  }
  const info = await stat(tmp);
  if (info.size < 20000) throw new Error(`PDF is unexpectedly small (${info.size} bytes)`);
  await rename(tmp, out);
  await tidyPdfMetadata(out);
  process.stdout.write(`Wrote ${out} (${info.size} bytes)\n`);
} finally {
  server.close();
}

// Drop the headless-browser producer string when pypdf is installed.
async function tidyPdfMetadata(pdfPath) {
  const script = `
import sys
try:
    from pypdf import PdfReader, PdfWriter
except Exception:
    sys.exit(0)
path = sys.argv[1]
reader = PdfReader(path)
writer = PdfWriter()
writer.append(reader)
writer.add_metadata({
    "/Title": "Level 1: Spark. Invent your game and make it playable | Level Up Makers",
    "/Author": "Level Up Makers",
    "/Subject": "Free Level 1 chapter of Level Up: Make Your First Game with AI. Not the complete manual.",
    "/Creator": "Level Up Makers",
})
with open(path, "wb") as handle:
    writer.write(handle)
`;
  await new Promise((resolveDone) => {
    const child = spawn("python3", ["-c", script, pdfPath], { stdio: "ignore" });
    child.on("error", resolveDone);
    child.on("exit", resolveDone);
  });
}
