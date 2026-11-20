/**
 * Temperature -> color, like a TV forecast map: purple/blue = cold, green = mild, orange/red = hot.
 * Colors between two stops are linearly interpolated, so 15° is between green and yellow.
 */
export const TEMPERATURE_STOPS: Array<[number, string]> = [
  [-20, '#a78bfa'],
  [-10, '#60a5fa'],
  [0, '#38bdf8'],
  [10, '#34d399'],
  [20, '#facc15'],
  [30, '#fb923c'],
  [40, '#ef4444'],
]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** @param alpha Opacity 0-1, e.g. for the fading fill under the chart line. */
export function temperatureColor(celsius: number, alpha = 1): string {
  const stops = TEMPERATURE_STOPS
  const last = stops[stops.length - 1]
  // Clamp to the scale: colder than -20° is still purple, hotter than 40° still red.
  const t = Math.min(Math.max(celsius, stops[0][0]), last[0])
  if (t === last[0]) return rgba(hexToRgb(last[1]), alpha)

  const upper = stops.findIndex(([stop]) => stop > t)
  const [t0, c0] = stops[upper - 1]
  const [t1, c1] = stops[upper]
  const ratio = (t - t0) / (t1 - t0)

  const a = hexToRgb(c0)
  const b = hexToRgb(c1)
  return rgba(
    a.map((v, i) => Math.round(v + (b[i] - v) * ratio)),
    alpha,
  )
}

function rgba(rgb: number[], alpha: number): string {
  return alpha === 1 ? `rgb(${rgb.join(',')})` : `rgba(${rgb.join(',')},${alpha})`
}

/** CSS gradient with the same stops, for the legend. */
export function temperatureGradientCss(): string {
  const min = TEMPERATURE_STOPS[0][0]
  const max = TEMPERATURE_STOPS[TEMPERATURE_STOPS.length - 1][0]
  const parts = TEMPERATURE_STOPS.map(([t, c]) => `${c} ${((t - min) / (max - min)) * 100}%`)
  return `linear-gradient(to right, ${parts.join(', ')})`
}
