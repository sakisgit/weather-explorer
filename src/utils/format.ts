/**
 * Formatting helpers.
 *
 * Time zones: we request `timezone=auto`, so Open-Meteo returns times in the
 * PLACE's local time, without an offset, e.g. "2026-11-20T14:00".
 * If we did `new Date("2026-11-20T14:00")` the browser would read it in the
 * USER's time zone, and for a place like Tokyo that is the wrong hour.
 * So for hours we simply read the string: "14:00" is already the local hour there.
 */

/** "2026-11-20T14:00" -> "14:00" */
export function formatHour(isoLocal: string): string {
  return isoLocal.slice(11, 16)
}

/** "2026-11-20T14:15" -> "2026-11-20T14:00": the hourly slot that contains this time. */
export function toHourSlot(isoLocal: string): string {
  return `${isoLocal.slice(0, 13)}:00`
}

/**
 * "2026-11-20" -> "Fri".
 * A bare date string is parsed as UTC midnight, which can become the previous day
 * in the Americas. Adding a midday time keeps it on the right calendar day everywhere.
 */
export function formatWeekday(isoDate: string): string {
  return new Date(`${isoDate}T12:00`).toLocaleDateString('en-GB', { weekday: 'short' })
}

/** "2026-11-20" -> "20 Nov" */
export function formatDayMonth(isoDate: string): string {
  return new Date(`${isoDate}T12:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatTemp(celsius: number): string {
  return `${Math.round(celsius)}°`
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** Wind direction in degrees -> compass point. 0° = from the North. */
export function degreesToCompass(deg: number): string {
  return COMPASS[Math.round(deg / 45) % 8]
}

/**
 * Beaufort scale: wind speed (km/h) -> force 0-12 and its name.
 * BEAUFORT_LIMITS[i] is the lowest speed of force i + 1.
 */
const BEAUFORT_LIMITS = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]
const BEAUFORT_NAMES = [
  'Calm',
  'Light air',
  'Light breeze',
  'Gentle breeze',
  'Moderate breeze',
  'Fresh breeze',
  'Strong breeze',
  'Near gale',
  'Gale',
  'Strong gale',
  'Storm',
  'Violent storm',
  'Hurricane force',
]

export function beaufort(kmh: number): { force: number; name: string } {
  const force = BEAUFORT_LIMITS.filter((limit) => Math.round(kmh) >= limit).length
  return { force, name: BEAUFORT_NAMES[force] }
}

/** Wave height (m) -> the WMO sea state name ("Slight", "Rough"…). */
const SEA_STATES: [maxMetres: number, name: string][] = [
  [0.1, 'Calm'],
  [0.5, 'Smooth'],
  [1.25, 'Slight'],
  [2.5, 'Moderate'],
  [4, 'Rough'],
  [6, 'Very rough'],
  [9, 'High'],
  [14, 'Very high'],
]

export function seaState(metres: number): string {
  return SEA_STATES.find(([max]) => metres <= max)?.[1] ?? 'Phenomenal'
}
