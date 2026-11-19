import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/http'

/**
 * One QueryClient for the whole app = one shared cache.
 *
 * These defaults are the core of our rate-limit strategy:
 * - staleTime 15 min: Open-Meteo updates its models roughly every hour, so data
 *   younger than 15 min is "fresh" and is served from cache without any request.
 * - gcTime 30 min: unused data stays in memory a while, so going back to a place is instant.
 * - refetchOnWindowFocus false: switching browser tabs should not trigger new requests.
 * - retry: retry network errors / 5xx up to 2 times, but NEVER 4xx.
 *   A 429 means "slow down"; retrying it would only make things worse.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})
