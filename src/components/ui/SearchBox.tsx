import { useId, useState } from 'react'
import { useGeocodingSearch } from '../../hooks/useGeocodingSearch'
import type { Place } from '../../types'
import { placeFromGeo } from '../../utils/places'

interface Props {
  onSelect: (place: Place) => void
}

/**
 * Place search with a results dropdown.
 *
 * Accessibility: follows the ARIA "combobox" pattern, so screen readers announce
 * the list, and the keyboard works (↑ ↓ to move, Enter to pick, Esc to close).
 */
export function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // highlighted result index
  const listId = useId()

  const { data: results = [], isFetching, isError, enabled } = useGeocodingSearch(query)
  const showList = open && enabled

  function choose(index: number) {
    const geo = results[index]
    if (!geo) return
    onSelect(placeFromGeo(geo))
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      choose(active)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        aria-label="Search for a place"
        placeholder="Search a city…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // Delay so a click on a result registers before the list closes
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 shadow-lg backdrop-blur outline-none placeholder:text-slate-500 focus:border-sky-500"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 py-1 text-sm shadow-xl"
        >
          {isError && <li className="px-4 py-2 text-red-400">Search failed. Try again.</li>}
          {!isError && results.length === 0 && (
            <li className="px-4 py-2 text-slate-400">{isFetching ? 'Searching…' : 'No places found'}</li>
          )}
          {results.map((geo, i) => (
            <li
              key={geo.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input
              onClick={() => choose(i)}
              className={`cursor-pointer px-4 py-2 ${i === active ? 'bg-slate-800' : ''}`}
            >
              <div className="text-slate-100">{geo.name}</div>
              <div className="text-xs text-slate-400">{[geo.admin1, geo.country].filter(Boolean).join(', ')}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
