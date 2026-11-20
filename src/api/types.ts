/**
 * Types for the Open-Meteo responses.
 *
 * We only type the fields we actually request. Open-Meteo returns
 * exactly the variables listed in the `current` / `hourly` / `daily` query params,
 * so these types must stay in sync with the params in `openMeteo.ts`.
 */

export interface CurrentWeather {
  time: string
  temperature_2m: number
  apparent_temperature: number
  relative_humidity_2m: number
  precipitation: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
  is_day: number // 1 = day, 0 = night
}

/** Hourly data comes as parallel arrays: index i of every array refers to time[i]. */
export interface HourlyWeather {
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  weather_code: number[]
  wind_speed_10m: number[]
}

export interface DailyWeather {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_sum: number[]
  precipitation_probability_max: number[]
}

export interface ForecastResponse {
  latitude: number
  longitude: number
  timezone: string
  utc_offset_seconds: number
  elevation: number
  current: CurrentWeather
  hourly: HourlyWeather
  daily: DailyWeather
}

/**
 * Response used by the compare view: current conditions + 7 daily summaries,
 * for MANY saved places in one request.
 */
export interface CompareResponse {
  latitude: number
  longitude: number
  current: Pick<CurrentWeather, 'time' | 'temperature_2m' | 'weather_code' | 'wind_speed_10m' | 'is_day'>
  daily: Pick<DailyWeather, 'time' | 'temperature_2m_max' | 'temperature_2m_min' | 'precipitation_probability_max'>
}

/**
 * Hourly data for one point of the map grid (temperature + icon for each hour).
 * Requested in UTC so every point shares the same time axis (needed by the time slider).
 */
export interface GridPointForecast {
  latitude: number
  longitude: number
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    is_day: number[]
  }
}

/** One result of the Geocoding API search. Optional fields are missing for some places. */
export interface GeoPlace {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string // region / state
  timezone?: string
  population?: number
}

export interface GeocodingResponse {
  results?: GeoPlace[] // the key is missing entirely when nothing matches
}

export interface LatLon {
  lat: number
  lon: number
}
