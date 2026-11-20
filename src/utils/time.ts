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
 * Where each new day starts on the time slider, in the USER's time zone:
 * [{ position: 0.29, label: 'Sat' }, ...], position = 0..1 along the slider.
 * Days starting in the first or last 3 hours are left out, so they don't crowd "Now" or the end.
 */
export function dayStartTicks(nowSlot: string, maxHours: number): Array<{ position: number; label: string }> {
  const ticks = []
  for (let h = 3; h <= maxHours - 3; h++) {
    const d = new Date(`${addHoursToSlot(nowSlot, h)}:00Z`)
    if (d.getHours() === 0) {
      ticks.push({ position: h / maxHours, label: d.toLocaleDateString('en-GB', { weekday: 'short' }) })
    }
  }
  return ticks
}

/**
 * "2026-11-20T14:00" (UTC) -> "Fri 16:00" in the USER's own time zone.
 * The map shows one moment for the whole world, so we label it in the viewer's clock.
 */
export function formatSlotForUser(slot: string): string {
  return new Date(`${slot}:00Z`).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}
