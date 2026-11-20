export const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
export const MANDI_SOURCE_URL = `https://api.data.gov.in/resource/${MANDI_RESOURCE_ID}`;
const DEFAULT_DATA_GOV_KEY = "579b464db66ec23bdd0000018db2b0111bce4d7d7fd7e1f420d51236";

const FIELD_ALIASES = {
  state: ["state"],
  district: ["district"],
  market: ["market", "marketname", "apmc"],
  commodity: ["commodity"],
  variety: ["variety"],
  arrivalDate: ["arrivaldate", "date"],
  minPrice: ["minprice", "minimumprice"],
  maxPrice: ["maxprice", "maximumprice"],
  modalPrice: ["modalprice"],
};

function normalizedKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function recordValue(record, aliases) {
  for (const [key, value] of Object.entries(record)) {
    if (aliases.includes(normalizedKey(key))) return value;
  }
  return null;
}

function textValue(value) {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text || null;
  }
  return null;
}

function priceValue(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(String(value).replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function isoDate(value) {
  const text = textValue(value);
  if (!text) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (iso) return text;
  const indian = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (!indian) return text;
  return `${indian[3]}-${indian[2].padStart(2, "0")}-${indian[1].padStart(2, "0")}`;
}

export function normalizeMandiRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  const state = textValue(recordValue(record, FIELD_ALIASES.state));
  const district = textValue(recordValue(record, FIELD_ALIASES.district));
  const market = textValue(recordValue(record, FIELD_ALIASES.market));
  const commodity = textValue(recordValue(record, FIELD_ALIASES.commodity));
  const arrivalDate = isoDate(recordValue(record, FIELD_ALIASES.arrivalDate));
  if (!state || !district || !market || !commodity || !arrivalDate) return null;

  return {
    state,
    district,
    market,
    commodity,
    variety: textValue(recordValue(record, FIELD_ALIASES.variety)),
    arrivalDate,
    minPrice: priceValue(recordValue(record, FIELD_ALIASES.minPrice)),
    maxPrice: priceValue(recordValue(record, FIELD_ALIASES.maxPrice)),
    modalPrice: priceValue(recordValue(record, FIELD_ALIASES.modalPrice)),
  };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function handleMandiRequest(request, apiKey, fetcher = fetch, options = {}) {
  if (request.method !== "GET") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const resolvedKey = (apiKey?.trim() && apiKey.trim() !== "your_actual_api_key")
    ? apiKey.trim()
    : DEFAULT_DATA_GOV_KEY;

  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(MANDI_SOURCE_URL);
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 1000;
  upstreamUrl.searchParams.set("api-key", resolvedKey);
  upstreamUrl.searchParams.set("format", "json");
  upstreamUrl.searchParams.set("limit", String(limit));
  upstreamUrl.searchParams.set("offset", "0");

  const filters = [
    ["state", "State"],
    ["district", "District"],
    ["market", "Market"],
    ["commodity", "Commodity"],
  ];
  for (const [queryKey, fieldName] of filters) {
    const value = requestUrl.searchParams.get(queryKey)?.trim();
    if (value) upstreamUrl.searchParams.set(`filters[${fieldName}]`, value);
  }

  let upstream;
  try {
    upstream = await fetcher(upstreamUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    return jsonResponse(502, { error: "upstream_unavailable" });
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return jsonResponse(502, { error: "credentials_rejected" });
  }
  if (!upstream.ok) {
    return jsonResponse(502, { error: "upstream_error", upstreamStatus: upstream.status });
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return jsonResponse(502, { error: "invalid_upstream_response" });
  }

  if (!payload || typeof payload !== "object" || !Array.isArray(payload.records)) {
    return jsonResponse(502, { error: "invalid_upstream_response" });
  }

  const records = payload.records
    .map(normalizeMandiRecord)
    .filter(Boolean)
    .sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));

  if (payload.records.length > 0 && records.length === 0) {
    return jsonResponse(502, {
      error: "unrecognized_upstream_fields",
      fields: Object.keys(payload.records[0] ?? {}),
    });
  }

  return jsonResponse(200, {
    records,
    total: Number.isFinite(Number(payload.total)) ? Number(payload.total) : records.length,
    source: "data.gov.in",
    resourceId: MANDI_RESOURCE_ID,
    fetchedAt: new Date().toISOString(),
  });
}
