export type WeatherLocation = {
  id: string;
  name: string;
  admin1: string | null;
  admin2: string | null;
  country: string;
  latitude: number;
  longitude: number;
};

export type CurrentWeather = {
  time: string;
  temperature: number | null;
  relativeHumidity: number | null;
  precipitation: number | null;
  rain: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
};

export type DailyForecast = {
  date: string;
  weatherCode: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
};

export type WeatherForecast = {
  current: CurrentWeather;
  daily: DailyForecast[];
  timezone: string;
};

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherServiceError";
  }
}

type JsonRecord = Record<string, unknown>;

async function getJson(url: URL, signal?: AbortSignal): Promise<JsonRecord> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new WeatherServiceError("network");
  }

  if (!response.ok) {
    throw new WeatherServiceError("http");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new WeatherServiceError("invalid-response");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new WeatherServiceError("invalid-response");
  }

  const record = data as JsonRecord;
  if (record.error === true) throw new WeatherServiceError("api");
  return record;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function searchWeatherLocations(query: string, signal?: AbortSignal): Promise<WeatherLocation[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: trimmedQuery,
    count: "10",
    language: "en",
    format: "json",
  }).toString();

  const response = await getJson(url, signal);
  if (response.results === undefined) return [];
  if (!Array.isArray(response.results)) throw new WeatherServiceError("invalid-response");

  return response.results.flatMap((result: unknown) => {
    if (!isRecord(result)) return [];
    const name = stringValue(result.name);
    const country = stringValue(result.country);
    const latitude = numberValue(result.latitude);
    const longitude = numberValue(result.longitude);
    if (!name || !country || latitude === null || longitude === null) return [];
    return [{
      id: `${latitude},${longitude}`,
      name,
      admin1: stringValue(result.admin1),
      admin2: stringValue(result.admin2),
      country,
      latitude,
      longitude,
    }];
  });
}

export async function fetchWeatherForecast(location: WeatherLocation, signal?: AbortSignal): Promise<WeatherForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  }).toString();

  const response = await getJson(url, signal);
  const current = response.current;
  const daily = response.daily;
  if (!isRecord(current) || !isRecord(daily)) throw new WeatherServiceError("invalid-response");

  const time = stringValue(current.time);
  const dates = daily.time;
  const weatherCodes = daily.weather_code;
  const temperatureMax = daily.temperature_2m_max;
  const temperatureMin = daily.temperature_2m_min;
  const precipitation = daily.precipitation_sum;
  const precipitationProbability = daily.precipitation_probability_max;

  if (
    !time ||
    !Array.isArray(dates) ||
    !Array.isArray(weatherCodes) ||
    !Array.isArray(temperatureMax) ||
    !Array.isArray(temperatureMin) ||
    !Array.isArray(precipitation) ||
    !Array.isArray(precipitationProbability) ||
    dates.length !== 7 ||
    [weatherCodes, temperatureMax, temperatureMin, precipitation, precipitationProbability].some((values) => values.length !== 7)
  ) {
    throw new WeatherServiceError("invalid-response");
  }

  const dailyForecast = dates.map((date, index): DailyForecast => {
    if (typeof date !== "string") throw new WeatherServiceError("invalid-response");
    return {
      date,
      weatherCode: numberValue(weatherCodes[index]),
      temperatureMax: numberValue(temperatureMax[index]),
      temperatureMin: numberValue(temperatureMin[index]),
      precipitation: numberValue(precipitation[index]),
      precipitationProbability: numberValue(precipitationProbability[index]),
    };
  });

  return {
    current: {
      time,
      temperature: numberValue(current.temperature_2m),
      relativeHumidity: numberValue(current.relative_humidity_2m),
      precipitation: numberValue(current.precipitation),
      rain: numberValue(current.rain),
      weatherCode: numberValue(current.weather_code),
      windSpeed: numberValue(current.wind_speed_10m),
    },
    daily: dailyForecast,
    timezone: stringValue(response.timezone) ?? "auto",
  };
}
