import type { LatLon } from '../api/types'
import { roundCoord } from './coords'

/** What the map currently shows: geographic bounds + size in pixels. */
export interface MapView {
  south: number
  west: number
  north: number
  east: number
  width: number
  height: number
}

/** A grid point: where to draw it on the map + which coordinates to ask the API for. */
export interface GridPoint {
  /** Position on screen. Can be outside -180..180 when the map shows a "copy" of the world. */
  lat: number
  lon: number
  /** Same point with longitude normalized to -180..180 (what the API and the cache use). */
  api: LatLon
}

// "Nice" spacings in degrees. Snapping to these keeps the grid stable while panning.
const NICE_STEPS = [0.25, 0.5, 1, 2, 3, 5, 10, 15, 20, 30]
const CELL_WIDTH_PX = 110 // roughly one marker every 110 px horizontally
const CELL_HEIGHT_PX = 80
const MAX_POINTS = 40 // hard cap per view: every point counts towards the API quota

function niceStep(raw: number): number {
  return NICE_STEPS.find((s) => s >= raw) ?? NICE_STEPS[NICE_STEPS.length - 1]
}

function nextStep(step: number): number {
  return NICE_STEPS.find((s) => s > step) ?? step * 2
}

function normalizeLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180
}

/**
 * Builds the grid of points to show for the current view.
 *
 * Key idea: points are SNAPPED to multiples of the step (e.g. every 2°: 36, 38, 40...).
 * So when you pan a little, most points are exactly the same as before, and their
 * weather is already in the cache. Only the new row/column needs a request.
 */
export function buildGrid(view: MapView): GridPoint[] {
  const cols = Math.max(2, Math.floor(view.width / CELL_WIDTH_PX))
  const rows = Math.max(2, Math.floor(view.height / CELL_HEIGHT_PX))

  const south = Math.max(view.south, -80)
  const north = Math.min(view.north, 80)
  const west = view.west
  const east = Math.min(view.east, view.west + 360) // never more than one world

  let latStep = niceStep((north - south) / rows)
  let lonStep = niceStep((east - west) / cols)

  // Too many points? Coarsen only the denser direction (rows or columns), one notch at a time,
  // so the grid thins out gradually instead of losing half of each direction at once.
  const lines = (from: number, to: number, step: number) => Math.floor(to / step) - Math.ceil(from / step) + 1
  while (lines(south, north, latStep) * lines(west, east, lonStep) > MAX_POINTS) {
    if (lines(south, north, latStep) >= lines(west, east, lonStep)) latStep = nextStep(latStep)
    else lonStep = nextStep(lonStep)
  }
  return generate(south, north, west, east, latStep, lonStep)
}

function generate(south: number, north: number, west: number, east: number, latStep: number, lonStep: number) {
  const points: GridPoint[] = []
  const seen = new Set<string>()

  // Integer counters instead of `lat += step` to avoid floating point drift (0.1 + 0.2 !== 0.3).
  for (let i = Math.ceil(south / latStep); i * latStep <= north; i++) {
    for (let j = Math.ceil(west / lonStep); j * lonStep <= east; j++) {
      const lat = roundCoord(i * latStep)
      const lon = roundCoord(j * lonStep)
      const api = { lat, lon: roundCoord(normalizeLon(lon)) }

      const key = `${api.lat},${api.lon}`
      if (seen.has(key)) continue // the same place can appear twice at world zoom
      seen.add(key)

      points.push({ lat, lon, api })
    }
  }
  return points
}

/** The current UTC hour in Open-Meteo's format, e.g. "2026-11-20T09:00". */
export function currentUtcHourSlot(now = new Date()): string {
  return `${now.toISOString().slice(0, 13)}:00`
}

/** "2026-11-20T23:00" + 2 hours -> "2026-11-21T01:00" (date rollover handled by Date). */
export function addHoursToSlot(slot: string, hours: number): string {
  const d = new Date(`${slot}:00Z`) // the "Z" = this is UTC
  d.setUTCHours(d.getUTCHours() + hours)
  return currentUtcHourSlot(d)
}
