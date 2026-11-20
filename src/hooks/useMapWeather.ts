import { type QueryClient, keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchGridForecast } from '../api/openMeteo'
import type { GridPointForecast, LatLon } from '../api/types'

const FRESH_FOR_MS = 15 * 60 * 1000
const MAX_PER_REQUEST = 50 // keeps the URL short

const pointKey = (p: LatLon) => ['map-point', p.lat, p.lon] as const

/**
 * Hourly weather for every place shown on the map overview.
 *
 * Per-point caching: each place's forecast is stored under its OWN cache key.
 * When the map moves we only request the places we don't already have (fresh),
 * all of them in a single batched request. Panning so that 3 new cities appear
 * costs 3 points, not every city on screen again.
 */
export function useMapWeather(points: LatLon[]) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['map-weather', points.map((p) => `${p.lat},${p.lon}`).join('|')],
    queryFn: ({ signal }) => loadPoints(points, queryClient, signal),
    enabled: points.length > 0,
    // Keep showing the old markers while the new view loads (no flicker when panning).
    placeholderData: keepPreviousData,
  })
}

async function loadPoints(points: LatLon[], queryClient: QueryClient, signal: AbortSignal) {
  const isFresh = (p: LatLon) => {
    const state = queryClient.getQueryState(pointKey(p))
    return state?.data !== undefined && Date.now() - state.dataUpdatedAt < FRESH_FOR_MS
  }

  const missing = points.filter((p) => !isFresh(p))

  for (let i = 0; i < missing.length; i += MAX_PER_REQUEST) {
    const chunk = missing.slice(i, i + MAX_PER_REQUEST)
    const results = await fetchGridForecast(chunk, signal)
    // Results come back in the same order as the request.
    results.forEach((result, j) => queryClient.setQueryData(pointKey(chunk[j]), result))
  }

  // Map: "lat,lon" -> forecast, for quick lookup when drawing markers.
  const byPoint = new Map<string, GridPointForecast>()
  for (const p of points) {
    const data = queryClient.getQueryData<GridPointForecast>(pointKey(p))
    if (data) byPoint.set(`${p.lat},${p.lon}`, data)
  }
  return byPoint
}
