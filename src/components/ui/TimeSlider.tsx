import { Pause, Play, RotateCcw } from 'lucide-react'

interface Props {
  /** Hours from now (0..max). */
  value: number
  max: number
  onChange: (hours: number) => void
  playing: boolean
  onTogglePlay: () => void
  /** Human label for the selected moment, e.g. "Fri 16:00". */
  label: string
  /** Where each new day starts along the slider (0..1), e.g. { position: 0.29, label: 'Sat' }. */
  dayTicks: Array<{ position: number; label: string }>
  /** Short status shown under the time, e.g. "Updating…". */
  status?: React.ReactNode
  /** Compact: only the play button and the time, no slider. */
  compact?: boolean
  /** Extra control at the end of the row (the collapse button). */
  trailing?: React.ReactNode
}

// The thumb is 16px wide and its center travels from 8px to (width - 8px):
// labels on the track use the same formula so they line up with the thumb.
const along = (position: number) => `calc(8px + (100% - 16px) * ${position})`

/**
 * A timeline for the next 48 hours: play, the selected time, and a slider with the
 * days marked under it. Play runs once from the current position to +48 h and stops.
 *
 * A native <input type="range">: keyboard (← →, Home, End) and screen readers work for free.
 * Its look comes from the .time-range class in index.css: the track fills with blue up
 * to the thumb, using the --progress CSS variable set below.
 */
export function TimeSlider({
  value,
  max,
  onChange,
  playing,
  onTogglePlay,
  label,
  dayTicks,
  status,
  compact,
  trailing,
}: Props) {
  const relative = value === 0 ? 'Now' : `+${value}h`
  const atEnd = value >= max

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause animation' : atEnd ? 'Replay the next 48 hours' : 'Play the next 48 hours'}
        title={playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow hover:bg-sky-500"
      >
        {playing ? (
          <Pause className="h-4 w-4" fill="currentColor" aria-hidden />
        ) : atEnd ? (
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        ) : (
          <Play className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden />
        )}
      </button>

      {/* Fixed width, so the slider doesn't shift as the time text changes */}
      <div className="w-[4.75rem] shrink-0 leading-tight" aria-live="off">
        <div className="text-sm font-medium text-slate-100 tabular-nums">{label}</div>
        <div className="truncate text-[11px] text-slate-400">{status ?? relative}</div>
      </div>

      {!compact && (
        <div className="relative min-w-0 flex-1 pb-4">
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Forecast time"
            aria-valuetext={`${label}, ${relative}`}
            className="time-range block w-full"
            style={{ '--progress': `${(value / max) * 100}%` } as React.CSSProperties}
          />
          {/* Day names under the track, where each day starts (in the viewer's time zone).
              On a narrow map the track is short, so only the day names are shown. */}
          <div className="absolute inset-x-0 bottom-0 h-3.5 text-[10px] text-slate-500" aria-hidden>
            <span className="absolute left-0 hidden @2xl:inline">Now</span>
            {dayTicks.map((tick) => (
              <span key={tick.label} className="absolute -translate-x-1/2" style={{ left: along(tick.position) }}>
                <span className="absolute -top-2.5 left-1/2 h-1.5 w-px bg-slate-500" />
                {tick.label}
              </span>
            ))}
            <span className="absolute right-0 hidden @2xl:inline">+{max}h</span>
          </div>
        </div>
      )}

      {trailing}
    </div>
  )
}
