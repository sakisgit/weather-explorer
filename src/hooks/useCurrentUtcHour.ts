import { useEffect, useState } from 'react'
import { currentUtcHourSlot } from '../utils/grid'

/**
 * The current UTC hour slot ("2026-11-20T09:00"), kept in state.
 *
 * Reading the clock directly during render is "impure" (each render could
 * give a different answer). Instead we read it once, then re-check every
 * minute, so a tab left open overnight still moves on to the new hour.
 */
export function useCurrentUtcHour(): string {
  const [slot, setSlot] = useState(() => currentUtcHourSlot())

  useEffect(() => {
    const id = setInterval(() => setSlot(currentUtcHourSlot()), 60_000)
    return () => clearInterval(id)
  }, [])

  return slot
}
