/**
 * Shown while a lazy-loaded chart's code is downloading (see the `lazy()` imports in
 * PlaceDetails and SavedPlaces). It has the chart's height, so nothing jumps when
 * the real chart appears.
 */
export function ChartPlaceholder({ className }: { className: string }) {
  return (
    <div
      className={`${className} flex animate-pulse items-center justify-center rounded-lg bg-slate-800/50 text-xs text-slate-500`}
    >
      Loading chart…
    </div>
  )
}
