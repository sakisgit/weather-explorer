import { useEffect, useState } from 'react'

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms.
 *
 * Typing "Athens" fires 6 changes; with debounce we search once, for "Athens".
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id) // a new keystroke cancels the pending update
  }, [value, delay])

  return debounced
}
