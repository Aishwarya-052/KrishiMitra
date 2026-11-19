import { handleMandiRequest } from "../server/mandiService.mjs";

function firstQueryValue(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  return "";
}

export default async function handler(req, res) {
  const requestUrl = new URL(req.url ?? "/api/mandi", "http://localhost");
  const query = req.query ?? {};

  for (const name of ["state", "district", "commodity"]) {
    const value = firstQueryValue(query[`filters[${name}]`])
      || firstQueryValue(query[name])
      || requestUrl.searchParams.get(`filters[${name}]`)
      || requestUrl.searchParams.get(name)
      || "";
    if (value.trim()) requestUrl.searchParams.set(name, value.trim());
  }

  try {
    const apiResponse = await handleMandiRequest(
      new Request(requestUrl, { method: req.method ?? "GET" }),
      process.env.DATA_GOV_IN_API_KEY,
      fetch,
      { limit: 200 },
    );
    const payload = await apiResponse.json();
    const status = apiResponse.ok ? 200 : apiResponse.status === 405 ? 405 : 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(status).json(payload);
  } catch (error) {
    console.error("Could not handle Vercel mandi API request.", error);
    return res.status(503).json({ error: "upstream_unavailable" });
  }
}
