import type { SourceItem } from "../schema.js";
import { getDateConfidence } from "../dates.js";

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  current_units?: Record<string, string>;
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
  };
  daily_units?: Record<string, string>;
}

const DEPTH_LIMITS: Record<string, number> = {
  quick: 1,
  medium: 2,
  deep: 3,
};

function extractLocation(query: string): string {
  const cleaned = query
    .replace(/\b(weather|forecast|temperature|conditions|rain|snow|wind|humidity)\b/gi, " ")
    .replace(/\b(today|tomorrow|this week|current|currently|right now|now|near me)\b/gi, " ")
    .replace(/\b(in|for|at|near|around)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || query.trim();
}

function weatherCodeLabel(code?: number): string {
  if (code === undefined) return "unknown conditions";
  if (code === 0) return "clear sky";
  if ([1, 2, 3].includes(code)) return "partly cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "rain";
  if ([71, 73, 75, 77].includes(code)) return "snow";
  if ([80, 81, 82].includes(code)) return "rain showers";
  if ([85, 86].includes(code)) return "snow showers";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return `weather code ${code}`;
}

function placeLabel(place: GeocodingResult): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

function forecastLine(data: ForecastResponse, dayIndex: number): string | null {
  const date = data.daily?.time?.[dayIndex];
  if (!date) return null;
  const max = data.daily?.temperature_2m_max?.[dayIndex];
  const min = data.daily?.temperature_2m_min?.[dayIndex];
  const rain = data.daily?.precipitation_probability_max?.[dayIndex];
  const code = data.daily?.weather_code?.[dayIndex];
  const tempUnit = data.daily_units?.temperature_2m_max || "C";
  const parts = [
    `${date}: ${weatherCodeLabel(code)}`,
    max !== undefined && min !== undefined ? `${Math.round(min)}-${Math.round(max)}${tempUnit}` : null,
    rain !== undefined ? `${rain}% precipitation` : null,
  ].filter(Boolean);
  return parts.join(", ");
}

export async function searchWeather(query: string, _fromDate: string, _toDate: string, depth: string): Promise<SourceItem[]> {
  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const location = extractLocation(query);
  if (!location) return [];

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geoResp = await fetch(geoUrl, { headers: { "User-Agent": "last30days-ts/0.1" }, signal: AbortSignal.timeout(15_000) });
    if (!geoResp.ok) return [];
    const geo = (await geoResp.json()) as GeocodingResponse;
    const place = geo.results?.[0];
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return [];

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set("latitude", String(place.latitude));
    forecastUrl.searchParams.set("longitude", String(place.longitude));
    forecastUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m");
    forecastUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code");
    forecastUrl.searchParams.set("timezone", "auto");
    forecastUrl.searchParams.set("forecast_days", String(Math.max(limit, 1)));

    const forecastResp = await fetch(forecastUrl, { headers: { "User-Agent": "last30days-ts/0.1" }, signal: AbortSignal.timeout(15_000) });
    if (!forecastResp.ok) return [];
    const forecast = (await forecastResp.json()) as ForecastResponse;
    const current = forecast.current;
    if (!current) return [];

    const tempUnit = forecast.current_units?.temperature_2m || "C";
    const windUnit = forecast.current_units?.wind_speed_10m || "km/h";
    const placeName = placeLabel(place);
    const now = current.time ? new Date(current.time).toISOString() : new Date().toISOString();
    const daily = Array.from({ length: limit }, (_, i) => forecastLine(forecast, i)).filter((line): line is string => !!line);
    const summary = [
      `Current weather in ${placeName}: ${weatherCodeLabel(current.weather_code)}, ${current.temperature_2m}${tempUnit}`,
      current.apparent_temperature !== undefined ? `feels like ${current.apparent_temperature}${tempUnit}` : null,
      current.relative_humidity_2m !== undefined ? `${current.relative_humidity_2m}% humidity` : null,
      current.wind_speed_10m !== undefined ? `${current.wind_speed_10m} ${windUnit} wind` : null,
      current.precipitation !== undefined ? `${current.precipitation} mm precipitation` : null,
    ].filter(Boolean).join(", ");

    return [{
      item_id: `weather-${place.latitude}-${place.longitude}-${current.time || Date.now()}`,
      source: "weather",
      title: `Weather for ${placeName}`,
      body: [summary, ...daily].join("\n"),
      url: `https://open-meteo.com/en/docs#latitude=${place.latitude}&longitude=${place.longitude}`,
      author: "Open-Meteo",
      container: "open-meteo.com",
      published_at: now,
      date_confidence: getDateConfidence(now, "", ""),
      engagement: {},
      score: 0,
      snippet: summary,
      metadata: {
        provider: "open-meteo",
        location: placeName,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone,
        forecast_days: daily.length,
      },
    }];
  } catch {
    return [];
  }
}
