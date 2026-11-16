import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleMandiRequest } from "./server/mandiService.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const distDirectory = resolve(root, "dist");

async function loadEnvironment() {
  try {
    const contents = await readFile(join(root, ".env"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match || match[1] in process.env) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  if (requestUrl.pathname === "/api/mandi") {
    try {
      const apiResponse = await handleMandiRequest(
        new Request(requestUrl, { method: request.method }),
        process.env.DATA_GOV_IN_API_KEY,
      );
      response.writeHead(apiResponse.status, Object.fromEntries(apiResponse.headers));
      response.end(await apiResponse.text());
    } catch (error) {
      console.error("Could not handle mandi API request.", error);
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "internal_server_error" }));
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405);
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }
  const requestedFile = resolve(distDirectory, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (requestedFile !== distDirectory && !requestedFile.startsWith(`${distDirectory}${sep}`)) {
    response.writeHead(403);
    response.end();
    return;
  }

  let filePath = requestedFile;
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") {
      console.error("Could not serve application file.", error);
      response.writeHead(500);
      response.end();
      return;
    }
    if (extname(pathname)) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      const index = await readFile(join(distDirectory, "index.html"));
      response.writeHead(200, { "Content-Type": contentTypes[".html"] });
      response.end(index);
    } catch (fallbackError) {
      console.error("Could not serve the application. Run npm run build first.", fallbackError);
      response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Application build not found. Run npm run build first.");
    }
  }
});

await loadEnvironment();
const port = Number(process.env.PORT ?? 4173);
server.listen(port, "0.0.0.0", () => {
  console.log(`KrishiMitra server listening on http://localhost:${port}`);
});
