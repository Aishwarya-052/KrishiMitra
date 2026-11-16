import { loadEnv, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleMandiRequest } from "./server/mandiService.mjs";

function mandiApiPlugin(apiKey: string | undefined) {
  async function handle(request: import("node:http").IncomingMessage, response: import("node:http").ServerResponse, next: () => void) {
    if (!request.url || new URL(request.url, "http://localhost").pathname !== "/api/mandi") {
      next();
      return;
    }

    try {
      const apiResponse = await handleMandiRequest(
        new Request(new URL(request.url, "http://localhost"), { method: request.method }),
        apiKey,
      );
      response.writeHead(apiResponse.status, Object.fromEntries(apiResponse.headers));
      response.end(await apiResponse.text());
    } catch (error) {
      console.error("Could not handle mandi API request.", error);
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "internal_server_error" }));
    }
  }

  return {
    name: "krishimitra-mandi-api",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((request, response, next) => void handle(request, response, next));
    },
    configurePreviewServer(server: import("vite").PreviewServer) {
      server.middlewares.use((request, response, next) => void handle(request, response, next));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = process.env.DATA_GOV_IN_API_KEY || env.DATA_GOV_IN_API_KEY;
  return {
    plugins: [react(), mandiApiPlugin(apiKey)],
  };
});
