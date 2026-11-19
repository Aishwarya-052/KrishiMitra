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

export const INDIAN_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const sampleCommodities = {
  Tomato: { variety: "Local", basePrice: 2400, trend: [0.92, 0.96, 1, 1.04] },
  Paddy: { variety: "Common", basePrice: 2350, trend: [1.01, 0.99, 1.02, 1] },
  Ragi: { variety: "Local", basePrice: 3850, trend: [1.06, 1.02, 1, 0.97] },
  Onion: { variety: "Red", basePrice: 2200, trend: [0.94, 0.98, 1.03, 1.07] },
  Maize: { variety: "Hybrid", basePrice: 2150, trend: [1.03, 1.01, 0.99, 0.97] },
  Cotton: { variety: "Medium Staple", basePrice: 6900, trend: [0.96, 0.99, 1.03, 1.05] },
  Chilli: { variety: "Dry", basePrice: 9200, trend: [1.02, 1.01, 0.99, 0.98] },
  Potato: { variety: "Local", basePrice: 1850, trend: [0.96, 0.98, 1.01, 1.04] },
  Coconut: { variety: "Mature", basePrice: 4200, trend: [1.02, 1, 0.99, 1.03] },
  Banana: { variety: "Local", basePrice: 1650, trend: [0.98, 1.01, 1.03, 1] },
  "Tur Dal": { variety: "Tur", basePrice: 9200, trend: [0.96, 0.99, 1.02, 1.04] },
  Arecanut: { variety: "Rashi", basePrice: 38000, trend: [1.03, 1, 0.98, 1.02] },
  Barley: { variety: "Local", basePrice: 2700, trend: [1.04, 1.02, 0.99, 1.01] },
  Apricot: { variety: "Dried", basePrice: 12500, trend: [0.97, 1, 1.02, 1.05] },
  Ginger: { variety: "Fresh", basePrice: 9800, trend: [0.93, 0.98, 1.03, 1.07] },
  Turmeric: { variety: "Local", basePrice: 8800, trend: [0.98, 1.01, 1.04, 1.02] },
  "Large Cardamom": { variety: "Large", basePrice: 42000, trend: [1.03, 1.01, 0.98, 1.02] },
  Wheat: { variety: "Common", basePrice: 2600, trend: [0.99, 1.02, 1.01, 1.04] },
} as const;

type SampleCommodityName = keyof typeof sampleCommodities;
type SampleMarket = {
  district: string;
  market: string;
  factor: number;
  crops?: readonly SampleCommodityName[];
};
type SampleMarketGroup = {
  state: typeof INDIAN_STATES_AND_UTS[number];
  crops: readonly SampleCommodityName[];
  markets: readonly SampleMarket[];
};

const sampleMarketGroups: readonly SampleMarketGroup[] = [
  { state: "Andaman and Nicobar Islands", crops: ["Paddy", "Tomato", "Chilli", "Coconut", "Banana"], markets: [
    { district: "South Andaman", market: "Port Blair Market", factor: 1.03 },
    { district: "North and Middle Andaman", market: "Diglipur Market", factor: 0.97 },
  ] },
  { state: "Andhra Pradesh", crops: ["Tomato", "Paddy", "Ragi", "Onion", "Maize", "Cotton", "Chilli"], markets: [
    { district: "Guntur", market: "Guntur APMC", factor: 1.1 },
    { district: "NTR", market: "Vijayawada APMC", factor: 1.03 },
  ] },
  { state: "Arunachal Pradesh", crops: ["Paddy", "Maize", "Chilli", "Ginger"], markets: [
    { district: "Papum Pare", market: "Naharlagun Market", factor: 1.02 },
    { district: "East Siang", market: "Pasighat Market", factor: 0.98 },
  ] },
  { state: "Assam", crops: ["Paddy", "Maize", "Chilli", "Ginger"], markets: [
    { district: "Kamrup Metropolitan", market: "Guwahati APMC", factor: 1.06 },
    { district: "Jorhat", market: "Jorhat APMC", factor: 1 },
  ] },
  { state: "Bihar", crops: ["Paddy", "Maize", "Tomato", "Potato"], markets: [
    { district: "Patna", market: "Patna APMC", factor: 1.04 },
    { district: "Muzaffarpur", market: "Muzaffarpur APMC", factor: 0.98 },
  ] },
  { state: "Chandigarh", crops: ["Tomato", "Onion", "Potato"], markets: [
    { district: "Chandigarh", market: "Sector 26 Market", factor: 1.05 },
    { district: "Chandigarh", market: "Manimajra Market", factor: 0.99 },
  ] },
  { state: "Chhattisgarh", crops: ["Paddy", "Maize", "Chilli", "Tomato"], markets: [
    { district: "Raipur", market: "Raipur APMC", factor: 1.03 },
    { district: "Durg", market: "Durg APMC", factor: 0.98 },
  ] },
  { state: "Dadra and Nagar Haveli and Daman and Diu", crops: ["Paddy", "Tomato", "Coconut", "Banana"], markets: [
    { district: "Dadra and Nagar Haveli", market: "Silvassa Market", factor: 1.02 },
    { district: "Daman", market: "Daman Market", factor: 0.98 },
  ] },
  { state: "Delhi", crops: ["Tomato", "Onion", "Potato", "Paddy"], markets: [
    { district: "North Delhi", market: "Azadpur APMC", factor: 1.08 },
    { district: "East Delhi", market: "Ghazipur APMC", factor: 1.03 },
  ] },
  { state: "Goa", crops: ["Paddy", "Tomato", "Coconut", "Chilli"], markets: [
    { district: "North Goa", market: "Mapusa Market", factor: 1.04 },
    { district: "South Goa", market: "Margao Market", factor: 1 },
  ] },
  { state: "Gujarat", crops: ["Tomato", "Onion", "Maize", "Cotton", "Chilli"], markets: [
    { district: "Ahmedabad", market: "Ahmedabad APMC", factor: 1.05 },
    { district: "Rajkot", market: "Rajkot APMC", factor: 1.01 },
  ] },
  { state: "Haryana", crops: ["Paddy", "Maize", "Cotton", "Potato"], markets: [
    { district: "Karnal", market: "Karnal APMC", factor: 1.06 },
    { district: "Hisar", market: "Hisar APMC", factor: 1.01 },
  ] },
  { state: "Himachal Pradesh", crops: ["Tomato", "Potato", "Maize", "Ginger"], markets: [
    { district: "Shimla", market: "Shimla APMC", factor: 1.08 },
    { district: "Solan", market: "Solan APMC", factor: 1.02 },
  ] },
  { state: "Jammu and Kashmir", crops: ["Paddy", "Maize", "Potato", "Chilli"], markets: [
    { district: "Jammu", market: "Jammu APMC", factor: 1.04 },
    { district: "Srinagar", market: "Srinagar APMC", factor: 1.08 },
  ] },
  { state: "Jharkhand", crops: ["Paddy", "Maize", "Tomato", "Potato"], markets: [
    { district: "Ranchi", market: "Ranchi APMC", factor: 1.04 },
    { district: "Dhanbad", market: "Dhanbad APMC", factor: 1 },
  ] },
  { state: "Karnataka", crops: ["Ragi", "Paddy", "Maize", "Tomato", "Onion", "Cotton", "Chilli", "Tur Dal", "Arecanut"], markets: [
    { district: "Bagalkote", market: "Bagalkote APMC", factor: 1.02, crops: ["Maize", "Onion", "Chilli", "Tur Dal"] },
    { district: "Ballari", market: "Ballari APMC", factor: 1.04, crops: ["Paddy", "Maize", "Tomato", "Cotton", "Chilli"] },
    { district: "Belagavi", market: "Belagavi APMC", factor: 0.98, crops: ["Maize", "Cotton", "Chilli", "Onion", "Tur Dal"] },
    { district: "Bengaluru Rural", market: "Bengaluru Rural APMC", factor: 1.05, crops: ["Ragi", "Tomato", "Maize", "Onion"] },
    { district: "Bengaluru Urban", market: "Yeshwanthpur APMC", factor: 1.08, crops: ["Tomato", "Onion", "Ragi"] },
    { district: "Bidar", market: "Bidar APMC", factor: 1.01, crops: ["Tur Dal", "Maize", "Cotton", "Chilli"] },
    { district: "Chamarajanagar", market: "Chamarajanagar APMC", factor: 0.99, crops: ["Ragi", "Maize", "Tomato", "Paddy"] },
    { district: "Chikkaballapura", market: "Chikkaballapura APMC", factor: 1.03, crops: ["Ragi", "Tomato", "Maize", "Onion"] },
    { district: "Chikkamagaluru", market: "Chikkamagaluru APMC", factor: 1.02, crops: ["Arecanut", "Paddy", "Maize", "Tomato"] },
    { district: "Chitradurga", market: "Chitradurga APMC", factor: 0.97, crops: ["Maize", "Onion", "Ragi", "Chilli"] },
    { district: "Dakshina Kannada", market: "Mangaluru APMC", factor: 1.06, crops: ["Arecanut", "Paddy", "Chilli", "Coconut"] },
    { district: "Davanagere", market: "Davanagere APMC", factor: 1, crops: ["Maize", "Paddy", "Cotton", "Chilli"] },
    { district: "Dharwad", market: "Hubballi APMC", factor: 0.97, crops: ["Maize", "Onion", "Cotton", "Chilli", "Ragi"] },
    { district: "Gadag", market: "Gadag APMC", factor: 0.96, crops: ["Maize", "Onion", "Cotton", "Chilli"] },
    { district: "Hassan", market: "Hassan APMC", factor: 1.01, crops: ["Arecanut", "Paddy", "Maize", "Tomato"] },
    { district: "Haveri", market: "Haveri APMC", factor: 0.99, crops: ["Maize", "Cotton", "Chilli", "Onion"] },
    { district: "Kalaburagi", market: "Kalaburagi APMC", factor: 1.03, crops: ["Tur Dal", "Maize", "Cotton", "Chilli"] },
    { district: "Kodagu", market: "Madikeri APMC", factor: 1.07, crops: ["Arecanut", "Paddy", "Ginger", "Tomato"] },
    { district: "Kolar", market: "Kolar APMC", factor: 1.05, crops: ["Tomato", "Ragi", "Maize", "Onion"] },
    { district: "Koppal", market: "Koppal APMC", factor: 0.98, crops: ["Paddy", "Maize", "Cotton", "Chilli"] },
    { district: "Mandya", market: "Mandya APMC", factor: 1.02, crops: ["Paddy", "Ragi", "Tomato", "Maize", "Chilli"] },
    { district: "Mysuru", market: "Bandipalya APMC", factor: 1, crops: ["Ragi", "Paddy", "Tomato", "Maize", "Chilli"] },
    { district: "Raichur", market: "Raichur APMC", factor: 1.01, crops: ["Paddy", "Maize", "Cotton", "Chilli"] },
    { district: "Ramanagara", market: "Ramanagara APMC", factor: 1.02, crops: ["Ragi", "Tomato", "Maize", "Arecanut"] },
    { district: "Shivamogga", market: "Shivamogga APMC", factor: 1.04, crops: ["Arecanut", "Paddy", "Maize", "Chilli"] },
    { district: "Tumakuru", market: "Tumakuru APMC", factor: 1.01, crops: ["Ragi", "Maize", "Tomato", "Onion"] },
    { district: "Udupi", market: "Udupi APMC", factor: 1.05, crops: ["Arecanut", "Paddy", "Coconut", "Chilli"] },
    { district: "Uttara Kannada", market: "Sirsi APMC", factor: 1.03, crops: ["Arecanut", "Paddy", "Maize", "Chilli", "Coconut"] },
    { district: "Vijayanagara", market: "Hosapete APMC", factor: 1, crops: ["Maize", "Cotton", "Chilli", "Paddy"] },
    { district: "Vijayapura", market: "Vijayapura APMC", factor: 1.02, crops: ["Maize", "Onion", "Tur Dal", "Cotton"] },
    { district: "Yadgir", market: "Yadgir APMC", factor: 0.98, crops: ["Tur Dal", "Maize", "Cotton", "Chilli"] },
  ] },
  { state: "Kerala", crops: ["Paddy", "Tomato", "Coconut", "Banana", "Ginger", "Chilli"], markets: [
    { district: "Ernakulam", market: "Aluva Market", factor: 1.05 },
    { district: "Palakkad", market: "Palakkad APMC", factor: 1 },
  ] },
  { state: "Ladakh", crops: ["Barley", "Apricot", "Potato"], markets: [
    { district: "Leh", market: "Leh Market", factor: 1.04 },
    { district: "Kargil", market: "Kargil Market", factor: 0.98 },
  ] },
  { state: "Lakshadweep", crops: ["Coconut", "Banana", "Chilli"], markets: [
    { district: "Lakshadweep", market: "Kavaratti Market", factor: 1.05 },
    { district: "Lakshadweep", market: "Agatti Market", factor: 0.98 },
  ] },
  { state: "Madhya Pradesh", crops: ["Paddy", "Maize", "Onion", "Cotton", "Chilli", "Wheat"], markets: [
    { district: "Indore", market: "Indore APMC", factor: 1.07 },
    { district: "Bhopal", market: "Bhopal APMC", factor: 1.01 },
  ] },
  { state: "Maharashtra", crops: ["Tomato", "Paddy", "Ragi", "Onion", "Maize", "Cotton", "Chilli"], markets: [
    { district: "Pune", market: "Pune APMC", factor: 1.08 },
    { district: "Nashik", market: "Nashik APMC", factor: 1.12 },
    { district: "Nagpur", market: "Nagpur APMC", factor: 1.02 },
  ] },
  { state: "Manipur", crops: ["Paddy", "Maize", "Chilli", "Ginger"], markets: [
    { district: "Imphal West", market: "Imphal APMC", factor: 1.05 },
    { district: "Thoubal", market: "Thoubal Market", factor: 0.99 },
  ] },
  { state: "Meghalaya", crops: ["Tomato", "Maize", "Chilli", "Ginger"], markets: [
    { district: "East Khasi Hills", market: "Shillong Market", factor: 1.08 },
    { district: "West Garo Hills", market: "Tura Market", factor: 1 },
  ] },
  { state: "Mizoram", crops: ["Paddy", "Tomato", "Chilli", "Ginger"], markets: [
    { district: "Aizawl", market: "Aizawl Market", factor: 1.06 },
    { district: "Lunglei", market: "Lunglei Market", factor: 1 },
  ] },
  { state: "Nagaland", crops: ["Paddy", "Maize", "Chilli", "Ginger"], markets: [
    { district: "Dimapur", market: "Dimapur Market", factor: 1.05 },
    { district: "Kohima", market: "Kohima Market", factor: 1 },
  ] },
  { state: "Odisha", crops: ["Paddy", "Maize", "Chilli", "Potato"], markets: [
    { district: "Cuttack", market: "Cuttack APMC", factor: 1.04 },
    { district: "Khordha", market: "Bhubaneswar APMC", factor: 1.02 },
  ] },
  { state: "Puducherry", crops: ["Paddy", "Tomato", "Chilli", "Banana"], markets: [
    { district: "Puducherry", market: "Puducherry Market", factor: 1.04 },
    { district: "Karaikal", market: "Karaikal Market", factor: 0.99 },
  ] },
  { state: "Punjab", crops: ["Paddy", "Maize", "Cotton", "Potato", "Onion"], markets: [
    { district: "Ludhiana", market: "Ludhiana APMC", factor: 1.06 },
    { district: "Amritsar", market: "Amritsar APMC", factor: 1.02 },
  ] },
  { state: "Rajasthan", crops: ["Maize", "Cotton", "Onion", "Chilli", "Wheat"], markets: [
    { district: "Jaipur", market: "Jaipur APMC", factor: 1.05 },
    { district: "Kota", market: "Kota APMC", factor: 1 },
  ] },
  { state: "Sikkim", crops: ["Tomato", "Potato", "Ginger", "Large Cardamom"], markets: [
    { district: "Gangtok", market: "Gangtok Market", factor: 1.08 },
    { district: "Namchi", market: "Namchi Market", factor: 1 },
  ] },
  { state: "Tamil Nadu", crops: ["Tomato", "Paddy", "Ragi", "Onion", "Maize", "Cotton", "Chilli"], markets: [
    { district: "Coimbatore", market: "Coimbatore APMC", factor: 1.04 },
    { district: "Madurai", market: "Madurai APMC", factor: 0.99 },
    { district: "Salem", market: "Salem APMC", factor: 0.96 },
  ] },
  { state: "Telangana", crops: ["Tomato", "Paddy", "Ragi", "Onion", "Maize", "Cotton", "Chilli"], markets: [
    { district: "Hyderabad", market: "Bowenpally APMC", factor: 1.08 },
    { district: "Warangal", market: "Warangal Enamamula APMC", factor: 1 },
  ] },
  { state: "Tripura", crops: ["Paddy", "Tomato", "Chilli", "Potato"], markets: [
    { district: "West Tripura", market: "Agartala APMC", factor: 1.05 },
    { district: "Gomati", market: "Udaipur Market", factor: 1 },
  ] },
  { state: "Uttar Pradesh", crops: ["Paddy", "Potato", "Onion", "Maize", "Wheat"], markets: [
    { district: "Lucknow", market: "Lucknow APMC", factor: 1.04 },
    { district: "Agra", market: "Agra APMC", factor: 1 },
  ] },
  { state: "Uttarakhand", crops: ["Paddy", "Potato", "Maize", "Wheat"], markets: [
    { district: "Dehradun", market: "Dehradun APMC", factor: 1.06 },
    { district: "Nainital", market: "Haldwani APMC", factor: 1.02 },
  ] },
  { state: "West Bengal", crops: ["Paddy", "Potato", "Onion", "Chilli"], markets: [
    { district: "Kolkata", market: "Kolkata APMC", factor: 1.08 },
    { district: "Darjeeling", market: "Siliguri APMC", factor: 1.02 },
  ] },
];

export function createSampleMandiRecords(referenceDate = new Date()): MandiRecord[] {
  const today = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
  return sampleMarketGroups.flatMap((group) => group.markets.flatMap((market) =>
    (market.crops ?? group.crops).flatMap((commodity) => {
      const crop = sampleCommodities[commodity];
      return crop.trend.map((dailyFactor, dayIndex) => {
        const arrivalDate = new Date(today + (dayIndex - 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const modalPrice = Math.round(crop.basePrice * market.factor * dailyFactor);
        return {
          state: group.state,
          district: market.district,
          market: market.market,
          commodity,
          variety: crop.variety,
          arrivalDate,
          minPrice: Math.round(modalPrice * 0.94),
          maxPrice: Math.round(modalPrice * 1.06),
          modalPrice,
        };
      });
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
