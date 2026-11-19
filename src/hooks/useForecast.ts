import { useQuery } from '@tanstack/react-query'
import { fetchCurrentBatch, fetchForecast } from '../api/openMeteo'
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

/** Current conditions for many places in one request (compare view). */
export function useCurrentBatch(points: LatLon[]) {
  const rounded = points.map((p) => roundLatLon(p))

  return useQuery({
    queryKey: ['current-batch', rounded.map((p) => `${p.lat},${p.lon}`).join('|')],
    queryFn: ({ signal }) => fetchCurrentBatch(rounded, signal),
    enabled: rounded.length > 0,
  })
}
