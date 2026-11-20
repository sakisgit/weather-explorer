import { useEffect, useRef, useState } from 'react'
import { BASEMAPS, BASEMAP_IDS } from '../../data/basemaps'
import { useUiStore } from '../../store/useUiStore'

/**
 * "Map style" button next to the search box: opens a small menu to switch
 * the basemap between Dark, Light and Color. The choice is persisted (useUiStore).
 */
export function BasemapSwitcher() {
  const basemap = useUiStore((s) => s.basemap)
  const setBasemap = useUiStore((s) => s.setBasemap)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close the menu on a click outside it or on Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Map style"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Map style"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur hover:border-sky-500 hover:text-sky-400"
      >
        {/* "Layers" icon */}
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3 2 8l10 5 10-5-10-5z" />
          <path d="m2 12 10 5 10-5" />
          <path d="m2 16 10 5 10-5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Map style"
          className="absolute top-full right-0 mt-2 w-40 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"
        >
          {BASEMAP_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={basemap === id}
              onClick={() => {
                setBasemap(id)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-800 ${
                basemap === id ? 'text-sky-400' : 'text-slate-200'
              }`}
            >
              <span
                className="h-7 w-7 shrink-0 rounded border border-slate-600"
                style={{ background: BASEMAPS[id].swatch }}
                aria-hidden
              />
              <span className="flex-1">{BASEMAPS[id].label}</span>
              {basemap === id && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
