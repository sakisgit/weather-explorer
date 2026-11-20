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

/**
 * "2026-11-20T14:00" (UTC) -> "Fri 16:00" in the USER's own time zone.
 * The map shows one moment for the whole world, so we label it in the viewer's clock.
 */
export function formatSlotForUser(slot: string): string {
  return new Date(`${slot}:00Z`).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}
