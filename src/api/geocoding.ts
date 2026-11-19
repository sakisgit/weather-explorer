import { getJson } from './http'
import type { GeoPlace, GeocodingResponse } from './types'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

/**
 * Search places by name ("Thessaloniki", "Par", ...).
 * Note: Open-Meteo has no reverse geocoding (coordinates -> name).
 */
export async function searchPlaces(name: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const params = new URLSearchParams({
    name,
    count: '8',
    language: 'en',
    format: 'json',
  })
  const data = await getJson<GeocodingResponse>(`${GEOCODING_URL}?${params}`, signal)
  return data.results ?? []
}
