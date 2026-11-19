import { getJson } from './http'
import type { CurrentOnlyResponse, ForecastResponse, LatLon } from './types'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

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
 * Current conditions for MANY places in a SINGLE request.
 *
 * Open-Meteo accepts comma-separated coordinates:
 *   ?latitude=37.98,40.64&longitude=23.72,22.94
 * and returns an array with one entry per location (same order).
 * Ten places = one request instead of ten, which matters for the rate limit.
 */
export async function fetchCurrentBatch(points: LatLon[], signal?: AbortSignal): Promise<CurrentOnlyResponse[]> {
  if (points.length === 0) return []

  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
    current: 'temperature_2m,weather_code,wind_speed_10m,is_day',
    timezone: 'auto',
  })
  const data = await getJson<CurrentOnlyResponse | CurrentOnlyResponse[]>(`${FORECAST_URL}?${params}`, signal)

  // With a single location the API returns an object, not an array. Normalize.
  return Array.isArray(data) ? data : [data]
}
