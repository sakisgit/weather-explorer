import { getJson } from './http'
import type { CompareResponse, ForecastResponse, GridPointForecast, LatLon, MarineResponse } from './types'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'

// Variables we ask for. Keep in sync with the types in ./types.ts
const CURRENT_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'is_day',
]
const HOURLY_VARS = ['temperature_2m', 'precipitation_probability', 'weather_code', 'wind_speed_10m']
const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
]

/**
 * Full forecast for ONE place: current conditions + hourly + 7 days.
 * Used by the place details panel.
 */
export function fetchForecast({ lat, lon }: LatLon, signal?: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: CURRENT_VARS.join(','),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
    forecast_days: '7',
    timezone: 'auto', // times come back in the place's local time
  })
  return getJson<ForecastResponse>(`${FORECAST_URL}?${params}`, signal)
}

/**
 * Compare data for MANY places in a SINGLE request:
 * current conditions + 7 days of high/low/rain chance.
 *
 * Open-Meteo accepts comma-separated coordinates:
 *   ?latitude=37.98,40.64&longitude=23.73,22.94
 * and returns an array with one entry per location (same order).
 * One HTTP request instead of one per saved place. 7 variables in total,
 * under the 10-variable threshold where Open-Meteo starts counting extra calls.
 */
export async function fetchCompareBatch(points: LatLon[], signal?: AbortSignal): Promise<CompareResponse[]> {
  if (points.length === 0) return []

  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
    current: 'temperature_2m,weather_code,wind_speed_10m,is_day',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '7',
    timezone: 'auto', // each place gets its own local days
  })
  const data = await getJson<CompareResponse | CompareResponse[]>(`${FORECAST_URL}?${params}`, signal)

  // With a single location the API returns an object, not an array. Normalize.
  return Array.isArray(data) ? data : [data]
}

/**
 * Hourly temperature + weather icon for MANY map grid points, in ONE request.
 *
 * - timezone=GMT (UTC): every point shares the same clock, so "hour 5" means the
 *   same moment everywhere. That's what lets the time slider move the whole map at once.
 * - forecast_days=3 gives 72 hours, enough for "now + 48 h" on the slider.
 * - Only 3 variables: Open-Meteo counts requests with more than 10 variables as extra calls.
 */
export async function fetchGridForecast(points: LatLon[], signal?: AbortSignal): Promise<GridPointForecast[]> {
  if (points.length === 0) return []

  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
    hourly: 'temperature_2m,weather_code,is_day',
    forecast_days: '3',
    timezone: 'GMT',
  })
  const data = await getJson<GridPointForecast | GridPointForecast[]>(`${FORECAST_URL}?${params}`, signal)
  return Array.isArray(data) ? data : [data]
}

/**
 * Current waves at a point (Open-Meteo Marine API, also free and keyless).
 * A separate service: the weather forecast API has no wave data.
 */
export function fetchMarine({ lat, lon }: LatLon, signal?: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'wave_height,wave_direction,wave_period',
    timezone: 'auto',
  })
  return getJson<MarineResponse>(`${MARINE_URL}?${params}`, signal)
}
