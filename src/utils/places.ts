import type { GeoPlace } from '../api/types'
import type { Place } from '../types'
import { formatLatLon, roundCoord } from './coords'

/** Converts a Geocoding API result into our app's Place. */
export function placeFromGeo(geo: GeoPlace): Place {
  return {
    id: `geo-${geo.id}`,
    name: geo.name,
    subtitle: [geo.admin1, geo.country].filter(Boolean).join(', '),
    lat: geo.latitude,
    lon: geo.longitude,
  }
}

/**
 * A Place for an arbitrary point (map click, geolocation).
 * Open-Meteo has no reverse geocoding, so the "name" is the formatted coordinates.
 */
export function placeFromCoords(lat: number, lon: number, name?: string): Place {
  const rLat = roundCoord(lat)
  const rLon = roundCoord(lon)
  return {
    id: `pt-${rLat},${rLon}`,
    name: name ?? formatLatLon({ lat, lon }),
    subtitle: name ? formatLatLon({ lat, lon }) : 'Selected on map',
    lat: rLat,
    lon: rLon,
  }
}
