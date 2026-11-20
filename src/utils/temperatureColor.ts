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

export function temperatureColor(celsius: number): string {
  const stops = TEMPERATURE_STOPS
  if (celsius <= stops[0][0]) return stops[0][1]
  if (celsius >= stops[stops.length - 1][0]) return stops[stops.length - 1][1]

  const upper = stops.findIndex(([t]) => t >= celsius)
  const [t0, c0] = stops[upper - 1]
  const [t1, c1] = stops[upper]
  const ratio = (celsius - t0) / (t1 - t0)

  const a = hexToRgb(c0)
  const b = hexToRgb(c1)
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * ratio))
  return `rgb(${mix.join(',')})`
}

/** CSS gradient with the same stops, for the legend. */
export function temperatureGradientCss(): string {
  const min = TEMPERATURE_STOPS[0][0]
  const max = TEMPERATURE_STOPS[TEMPERATURE_STOPS.length - 1][0]
  const parts = TEMPERATURE_STOPS.map(([t, c]) => `${c} ${((t - min) / (max - min)) * 100}%`)
  return `linear-gradient(to right, ${parts.join(', ')})`
}
