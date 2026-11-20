/**
 * App-level (client state) types, as opposed to the API response types in api/types.ts.
 */

/** A place the user is looking at: from a search result, a map click or geolocation. */
export interface Place {
  /** Stable id: geocoding id when available, otherwise built from coordinates. */
  id: string
  name: string
  /** Secondary line, e.g. "Central Macedonia, Greece". */
  subtitle?: string
  lat: number
  lon: number
}
