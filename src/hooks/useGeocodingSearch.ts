import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchPlaces } from '../api/geocoding'
import { useDebouncedValue } from './useDebouncedValue'

const MIN_CHARS = 2

/**
 * Place search with three request-saving tricks:
 * 1. debounce: wait 300 ms after the last keystroke
 * 2. min length: no request for 0-1 characters
 * 3. cache: searching "Paris" twice only hits the network once (key is lowercased)
 *
 * keepPreviousData keeps the old results visible while the new ones load,
 * so the dropdown doesn't flicker on every keystroke.
 */
export function useGeocodingSearch(query: string) {
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 300)
  const enabled = debounced.length >= MIN_CHARS

  const result = useQuery({
    queryKey: ['geocoding', debounced],
    queryFn: ({ signal }) => searchPlaces(debounced, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // place names/coords don't change; cache for a day
    placeholderData: keepPreviousData,
  })

  return { ...result, enabled }
}
