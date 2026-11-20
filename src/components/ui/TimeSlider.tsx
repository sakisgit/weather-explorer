interface Props {
  /** Hours from now (0..max). */
  value: number
  max: number
  onChange: (hours: number) => void
  playing: boolean
  onTogglePlay: () => void
  /** Human label for the selected moment, e.g. "Fri 16:00". */
  label: string
}

/**
 * Scrub through the next 48 hours, or press play to animate the map like a TV forecast.
 * A native <input type="range">: keyboard (← →, Home, End) and screen readers work for free.
 */
export function TimeSlider({ value, max, onChange, playing, onTogglePlay, label }: Props) {
  const relative = value === 0 ? 'Now' : `+${value}h`

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? 'Pause animation' : 'Play the next 48 hours'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white hover:bg-sky-500"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />
            </svg>
          )}
        </button>
        <div className="text-sm text-slate-100" aria-live="off">
          {label} <span className="text-xs text-slate-400">({relative})</span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Forecast time"
        aria-valuetext={`${label}, ${relative}`}
        className="w-full accent-sky-500"
      />
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>Now</span>
        <span>+24h</span>
        <span>+48h</span>
      </div>
    </div>
  )
}
