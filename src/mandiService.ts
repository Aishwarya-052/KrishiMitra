export type MandiRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string | null;
  arrivalDate: string;
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number | null;
};

export type MandiResponse = {
  records: MandiRecord[];
  total: number;
  source: "data.gov.in";
  resourceId: string;
  fetchedAt: string;
};

export type MandiFilters = {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
};

export class MandiServiceError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "MandiServiceError";
  }
}

export async function fetchMandiRecords(filters: MandiFilters = {}, signal?: AbortSignal): Promise<MandiResponse> {
  const url = new URL("/api/mandi", window.location.origin);
  for (const [key, value] of Object.entries(filters)) {
    if (value) url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new MandiServiceError("network_error");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MandiServiceError("invalid_response");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new MandiServiceError("invalid_response");
  }

  const data = payload as Record<string, unknown>;
  if (!response.ok) {
    throw new MandiServiceError(typeof data.error === "string" ? data.error : "api_error");
  }
  if (
    !Array.isArray(data.records) ||
    typeof data.total !== "number" ||
    data.source !== "data.gov.in" ||
    typeof data.resourceId !== "string" ||
    typeof data.fetchedAt !== "string"
  ) {
    throw new MandiServiceError("invalid_response");
  }

  return data as MandiResponse;
}
