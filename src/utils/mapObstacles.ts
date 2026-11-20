/** A rectangle in screen pixels, relative to the map's top-left corner. */
export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Screen rectangles of the UI floating over the map (elements marked with
 * `data-map-obstacle`, e.g. the search box and the time-slider card, plus
 * Leaflet's zoom and attribution controls),
 * relative to the map's top-left corner.
 */
export function readObstacles(mapContainer: HTMLElement): Rect[] {
  const map = mapContainer.getBoundingClientRect()
  // Leaflet's own controls (zoom buttons, attribution) count too.
  const selector = '[data-map-obstacle], .leaflet-control-zoom, .leaflet-control-attribution'
  return [...mapContainer.ownerDocument.querySelectorAll(selector)].map((el) => {
    const r = el.getBoundingClientRect()
    return { left: r.left - map.left, top: r.top - map.top, right: r.right - map.left, bottom: r.bottom - map.top }
  })
}

/**
 * How many pixels to move the map centre down so that a point placed "at the
 * centre" lands in the middle of the free vertical space instead.
 * Only obstacles that cross the centre line count: on a wide desktop map the
 * side cards don't cover the centre, so this returns 0 there.
 */
export function freeCenterOffsetY(width: number, height: number, obstacles: Rect[]): number {
  const cx = width / 2
  const cy = height / 2
  const crossing = obstacles.filter((r) => r.left < cx && r.right > cx)
  const top = Math.max(0, ...crossing.filter((r) => r.top < cy).map((r) => r.bottom))
  const bottom = Math.min(height, ...crossing.filter((r) => r.bottom > cy).map((r) => r.top))
  if (bottom <= top) return 0 // nothing sensible to do
  return cy - (top + bottom) / 2
}
