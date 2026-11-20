import { Pause, Play } from 'lucide-react'

interface Props {
  /** Hours from now (0..max). */
  value: number
  max: number
  onChange: (hours: number) => void
  playing: boolean
  onTogglePlay: () => void
  /** Human label for the selected moment, e.g. "Fri 16:00". */
  label: string
  /** Compact: only the play button and the time, no slider. */
  compact?: boolean
  /** Extra control at the end of the top row (the card's collapse button). */
  trailing?: React.ReactNode
}

/**
 * Scrub through the next 48 hours, or press play to animate the map like a TV forecast.
 * A native <input type="range">: keyboard (← →, Home, End) and screen readers work for free.
 * Its look comes from the .time-range class in index.css: the track fills with blue up
 * to the thumb, using the --progress CSS variable set below.
 */
export function TimeSlider({ value, max, onChange, playing, onTogglePlay, label, compact, trailing }: Props) {
  const relative = value === 0 ? 'Now' : `+${value}h`
  const progress = `${(value / max) * 100}%`

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
            <Pause className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" aria-hidden />
          )}
        </button>
        <div className="flex-1 text-sm whitespace-nowrap text-slate-100" aria-live="off">
          {label} <span className="text-xs text-slate-400">({relative})</span>
        </div>
        {trailing}
      </div>

      {!compact && (
        <>
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Forecast time"
            aria-valuetext={`${label}, ${relative}`}
            className="time-range w-full"
            style={{ '--progress': progress } as React.CSSProperties}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Now</span>
            <span>+24h</span>
            <span>+48h</span>
          </div>
        </>
      )}
    </div>
  )
}
