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

const sampleMarkets = [
  { state: "Karnataka", district: "Bengaluru Urban", market: "Yeshwanthpur APMC", factor: 1.08 },
  { state: "Karnataka", district: "Mysuru", market: "Bandipalya APMC", factor: 1 },
  { state: "Karnataka", district: "Dharwad", market: "Hubballi APMC", factor: 0.97 },
  { state: "Karnataka", district: "Kolar", market: "Kolar APMC", factor: 1.05 },
  { state: "Karnataka", district: "Belagavi", market: "Belagavi APMC", factor: 0.98 },
  { state: "Maharashtra", district: "Pune", market: "Pune APMC", factor: 1.08 },
  { state: "Maharashtra", district: "Nashik", market: "Nashik APMC", factor: 1.12 },
  { state: "Maharashtra", district: "Nagpur", market: "Nagpur APMC", factor: 1.02 },
  { state: "Tamil Nadu", district: "Coimbatore", market: "Coimbatore APMC", factor: 1.04 },
  { state: "Tamil Nadu", district: "Madurai", market: "Madurai APMC", factor: 0.99 },
  { state: "Tamil Nadu", district: "Salem", market: "Salem APMC", factor: 0.96 },
  { state: "Andhra Pradesh", district: "Guntur", market: "Guntur APMC", factor: 1.1 },
  { state: "Andhra Pradesh", district: "NTR", market: "Vijayawada APMC", factor: 1.03 },
  { state: "Telangana", district: "Hyderabad", market: "Bowenpally APMC", factor: 1.08 },
  { state: "Telangana", district: "Warangal", market: "Warangal Enamamula APMC", factor: 1 },
  { state: "Punjab", district: "Ludhiana", market: "Ludhiana APMC", factor: 1.06 },
  { state: "Punjab", district: "Amritsar", market: "Amritsar APMC", factor: 1.02 },
  { state: "Uttar Pradesh", district: "Lucknow", market: "Lucknow APMC", factor: 1.04 },
  { state: "Uttar Pradesh", district: "Agra", market: "Agra APMC", factor: 1 },
  { state: "Madhya Pradesh", district: "Indore", market: "Indore APMC", factor: 1.07 },
  { state: "Madhya Pradesh", district: "Bhopal", market: "Bhopal APMC", factor: 1.01 },
];

const sampleCommodities = [
  { commodity: "Tomato", variety: "Local", basePrice: 2400, trend: [0.92, 0.96, 1, 1.04] },
  { commodity: "Paddy", variety: "Common", basePrice: 2350, trend: [1.01, 0.99, 1.02, 1] },
  { commodity: "Ragi", variety: "Local", basePrice: 3850, trend: [1.06, 1.02, 1, 0.97] },
  { commodity: "Onion", variety: "Red", basePrice: 2200, trend: [0.94, 0.98, 1.03, 1.07] },
  { commodity: "Maize", variety: "Hybrid", basePrice: 2150, trend: [1.03, 1.01, 0.99, 0.97] },
  { commodity: "Cotton", variety: "Medium Staple", basePrice: 6900, trend: [0.96, 0.99, 1.03, 1.05] },
  { commodity: "Chilli", variety: "Dry", basePrice: 9200, trend: [1.02, 1.01, 0.99, 0.98] },
];

export function createSampleMandiRecords(referenceDate = new Date()): MandiRecord[] {
  const today = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
  return sampleMarkets.flatMap((market) => sampleCommodities.flatMap((crop) =>
    crop.trend.map((dailyFactor, dayIndex) => {
      const arrivalDate = new Date(today + (dayIndex - 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const modalPrice = Math.round(crop.basePrice * market.factor * dailyFactor);
      return {
        state: market.state,
        district: market.district,
        market: market.market,
        commodity: crop.commodity,
        variety: crop.variety,
        arrivalDate,
        minPrice: Math.round(modalPrice * 0.94),
        maxPrice: Math.round(modalPrice * 1.06),
        modalPrice,
      };
    }),
  ));
}

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
