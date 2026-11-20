import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchCompareBatch, fetchForecast } from '../api/openMeteo'
import type { LatLon } from '../api/types'
import { roundLatLon } from '../utils/coords'

/**
 * Full forecast for one place. Pass `null` to disable (nothing selected yet).
 *
 * The query key uses ROUNDED coordinates, so clicking two spots 300 m apart
 * reuses the same cached forecast instead of making a second request.
 */
export function useForecast(point: LatLon | null) {
  const rounded = point ? roundLatLon(point) : null

  return useQuery({
    queryKey: ['forecast', rounded?.lat, rounded?.lon],
    queryFn: ({ signal }) => fetchForecast(rounded!, signal),
    enabled: rounded !== null,
  })
}

/** Lookup key for a place in the compare results: its rounded coordinates. */
export function compareKey(point: LatLon): string {
  const r = roundLatLon(point)
  return `${r.lat},${r.lon}`
}

/**
 * Compare data for all saved places in ONE request.
 *
 * Returns a Map keyed by coordinates (not an array by position): with
 * keepPreviousData the OLD result is shown while the new one loads, and after
 * removing a place the positions shift, so index-based matching would show
 * the wrong weather for a moment. Matching by coordinates is always correct.
 */
export function useCompareForecast(points: LatLon[]) {
  const rounded = points.map((p) => roundLatLon(p))

  return useQuery({
    queryKey: ['compare', rounded.map((p) => `${p.lat},${p.lon}`).join('|')],
    queryFn: async ({ signal }) => {
      const results = await fetchCompareBatch(rounded, signal)
      // Results come back in request order: pair them with the coordinates we asked for.
      return new Map(results.map((r, i) => [compareKey(rounded[i]), r]))
    },
    enabled: rounded.length > 0,
    placeholderData: keepPreviousData,
  })
}
