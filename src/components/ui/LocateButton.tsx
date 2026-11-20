import { LocateFixed } from 'lucide-react'

interface Props {
  onClick: () => void
  locating: boolean
}

/** "Show the weather where I am" button that sits next to the search box. */
export function LocateButton({ onClick, locating }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locating}
      aria-label="Show weather at my location"
      title="My location"
      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur hover:border-sky-500 hover:text-sky-400 disabled:opacity-60"
    >
      {locating ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" aria-hidden />
      ) : (
        <LocateFixed className="h-5 w-5" aria-hidden />
      )}
    </button>
  )
}
