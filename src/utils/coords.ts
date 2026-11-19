import type { LatLon } from '../api/types'

/**
 * Round coordinates before using them in a request / cache key.
 *
 * 2 decimals ≈ 1.1 km. Weather models have a resolution of a few km anyway,
 * so 37.98381 and 37.98012 give the same forecast. Rounding makes both
 * hit the SAME cache entry instead of making two requests.
 */
export function roundCoord(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function roundLatLon({ lat, lon }: LatLon, decimals = 2): LatLon {
  return { lat: roundCoord(lat, decimals), lon: roundCoord(lon, decimals) }
}

export function formatLatLon({ lat, lon }: LatLon): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`
}
