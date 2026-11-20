import { LoaderCircle, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
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
 * Press "/" anywhere on the page to jump to the search box (like GitHub or YouTube).
 */
export function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // highlighted result index
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // "/" from anywhere focuses the search, unless the user is already typing somewhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      e.preventDefault() // otherwise the "/" would be typed into the box
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const { data: results = [], isFetching, isError, enabled, outdated } = useGeocodingSearch(query)
  const showList = open && enabled
  // Enter pressed while the results were still for an earlier text: pick the first
  // result as soon as the right ones arrive (see the effect below).
  const [enterPending, setEnterPending] = useState(false)

  function choose(index: number) {
    const geo = results[index]
    if (!geo) return
    onSelect(placeFromGeo(geo))
    setQuery('')
    setOpen(false)
  }

  useEffect(() => {
    if (!enterPending || outdated) return
    // No dependency list: it runs after every render, so choose() sees the latest results.
    // A frame later, so the state updates happen outside the effect's own run.
    const id = requestAnimationFrame(() => {
      setEnterPending(false)
      choose(0)
    })
    return () => cancelAnimationFrame(id)
  })

  function clear() {
    setQuery('')
    setActive(0)
    inputRef.current?.focus() // keep typing right away
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
      // Typing "Rome" fast and pressing Enter must not open a result of the PREVIOUS
      // search that is still on screen: wait until the results match the text.
      if (outdated) setEnterPending(true)
      else choose(active)
    } else if (e.key === 'Escape') {
      setEnterPending(false)
      // First Esc closes the list, a second one clears the text. preventDefault: Chrome and
      // Firefox would otherwise clear a type="search" box on the first Esc (Safari doesn't).
      e.preventDefault()
      if (showList) setOpen(false)
      else setQuery('')
    }
  }

  return (
    <div className="relative">
      {/* Magnifier on the left; a spinner in its place while results are loading */}
      <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-slate-400" aria-hidden>
        {enabled && (isFetching || outdated) ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-sky-400" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </span>
      <input
        ref={inputRef}
        type="search"
        aria-keyshortcuts="/"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        aria-label="Search for a place"
        placeholder="Search a city…"
        value={query}
        onChange={(e) => {
          setEnterPending(false) // typing again cancels a waiting Enter
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => {
          clearTimeout(closeTimer.current) // focused again quickly (e.g. with "/"): keep the list
          setOpen(true)
        }}
        // Delay so a click on a result registers before the list closes
        onBlur={() => {
          closeTimer.current = setTimeout(() => setOpen(false), 150)
        }}
        onKeyDown={onKeyDown}
        // The browser's own clear (×) button is hidden: we draw our own, the same in every browser.
        className="peer w-full rounded-lg border border-slate-700 bg-slate-900/90 py-2.5 pr-10 pl-9 text-sm text-slate-100 shadow-lg backdrop-blur outline-none placeholder:text-slate-500 focus:border-sky-500 [&::-webkit-search-cancel-button]:appearance-none"
      />

      {query ? (
        <button
          type="button"
          onClick={clear}
          onMouseDown={(e) => e.preventDefault()} // keep focus in the input
          aria-label="Clear search"
          title="Clear"
          className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        // Shortcut hint, only on wide maps (keyboards) and hidden while the box has focus.
        <kbd
          className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-slate-600 px-1.5 font-sans text-[11px] leading-4 text-slate-400 peer-focus:hidden @lg:block"
          aria-hidden
        >
          /
        </kbd>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          // Results of an earlier search are dimmed until the new ones arrive.
          className={`absolute mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 py-1 text-sm shadow-xl transition-opacity ${
            outdated ? 'opacity-60' : ''
          }`}
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
