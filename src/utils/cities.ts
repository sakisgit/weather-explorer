import L from 'leaflet'
import type { LatLon } from '../api/types'
import { CITIES, type City } from '../data/cities'
import type { Place } from '../types'
import { roundLatLon } from './coords'

/** A rectangle in screen pixels, relative to the map's top-left corner. */
export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

/** What the map currently shows. */
export interface MapView {
  south: number
  west: number
  north: number
  east: number
  zoom: number
  /** UI floating over the map (search box, controls card): no labels are placed under it. */
  obstacles?: Rect[]
}

export interface VisibleCity extends City {
  /** Longitude to DRAW at. Differs from `lon` by ±360 when the map shows a copy of the world. */
  displayLon: number
  /** Rounded coordinates used for the request and the cache key. */
  api: LatLon
}

const MAX_CITIES = 40 // every city counts towards the API quota
// Minimum distance between two labels, in pixels. Smaller = denser map.
const MIN_DX = 100
const MIN_DY = 50
// A label's box around its city coordinate, in pixels (matches the DivIcon in CitiesLayer).
const LABEL_HALF_WIDTH = 45
const LABEL_ABOVE = 20
const LABEL_BELOW = 36

function maxTierForZoom(zoom: number): City['tier'] {
  if (zoom <= 3) return 1
  if (zoom <= 5) return 2
  return 3
}

/**
 * Picks the cities to show for the current view, like a TV map:
 * 1. Filter by importance for the zoom level (few big cities zoomed out, more zoomed in).
 * 2. Keep only cities inside the visible area.
 * 3. Skip cities whose label would be hidden under UI floating over the map.
 * 4. Collision check: walk the cities in order of importance and skip any city whose
 *    label would overlap one already placed. Distances are measured in screen pixels
 *    at the current zoom, using Leaflet's Web Mercator projection.
 */
export function selectVisibleCities(view: MapView): VisibleCity[] {
  const maxTier = maxTierForZoom(view.zoom)
  const placed: Array<{ x: number; y: number }> = []
  const result: VisibleCity[] = []
  // Screen pixel (0, 0) = the map's top-left corner (north-west) at this zoom.
  const origin = L.CRS.EPSG3857.latLngToPoint(L.latLng(view.north, view.west), view.zoom)

  for (const city of CITIES) {
    if (result.length >= MAX_CITIES) break
    if (city.tier > maxTier) continue
    if (city.lat < view.south || city.lat > view.north) continue

    // With worldCopyJump the view can span e.g. -200..160: find the copy of the city that is visible.
    const displayLon = [city.lon, city.lon - 360, city.lon + 360].find((lon) => lon >= view.west && lon <= view.east)
    if (displayLon === undefined) continue

    // Pure projection (lat/lon -> pixel at this zoom), no map instance needed.
    const { x, y } = L.CRS.EPSG3857.latLngToPoint(L.latLng(city.lat, displayLon), view.zoom)
    if (view.obstacles?.some((r) => labelHitsRect(x - origin.x, y - origin.y, r))) continue
    const overlaps = placed.some((p) => Math.abs(p.x - x) < MIN_DX && Math.abs(p.y - y) < MIN_DY)
    if (overlaps) continue

    placed.push({ x, y })
    result.push({ ...city, displayLon, api: roundLatLon(city) })
  }

  return result
}

/** Would a label drawn at screen point (x, y) overlap the rectangle? */
function labelHitsRect(x: number, y: number, r: Rect): boolean {
  return x + LABEL_HALF_WIDTH > r.left && x - LABEL_HALF_WIDTH < r.right && y + LABEL_BELOW > r.top && y - LABEL_ABOVE < r.bottom
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

/** "GR" -> "Greece", using the browser's built-in Intl API (no data file needed). */
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

export function placeFromCity(city: City): Place {
  return {
    id: `city-${city.name}-${city.country}`,
    name: city.name,
    subtitle: countryName(city.country),
    lat: city.lat,
    lon: city.lon,
  }
}
