import { useCallback, useEffect, useRef, useState } from 'react'
import type { LatLon } from '../api/types'

type Status = 'idle' | 'locating' | 'success' | 'error'

interface Options {
  /** Called every time a position is found. */
  onLocated: (position: LatLon) => void
}

/**
 * Wraps the browser Geolocation API (navigator.geolocation) in a hook.
 *
 * Permission strategy (good UX + what browsers recommend):
 * - We do NOT pop the permission prompt on page load. Prompts nobody asked for
 *   tend to get denied, and then the feature is blocked for good.
 * - If the user ALREADY granted permission on a previous visit, we locate
 *   automatically (no prompt appears), so returning users see their weather at once.
 * - Otherwise the user clicks "My location", which shows the prompt in context.
 */
export function useGeolocation({ onLocated }: Options) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  // Keep the latest callback in a ref so `locate` can stay stable (same function
  // on every render) and still call the newest onLocated.
  const onLocatedRef = useRef(onLocated)
  useEffect(() => {
    onLocatedRef.current = onLocated
  }, [onLocated])

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setError('Your browser does not support geolocation.')
      return
    }

    setStatus('locating')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('success')
        onLocatedRef.current({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        setStatus('error')
        setError(errorMessage(err))
      },
      {
        enableHighAccuracy: false, // city-level is plenty for weather and is faster / saves battery
        timeout: 10_000,
        maximumAge: 10 * 60 * 1000, // a position up to 10 min old is fine
      },
    )
  }, [])

  // Auto-locate only if permission was already granted earlier.
  useEffect(() => {
    // The Permissions API is missing in some older browsers; then we just wait for a click.
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'granted') locate()
      })
      .catch(() => {})
  }, [locate])

  return { status, error, locate, clearError: () => setError(null) }
}

function errorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location access was denied. You can still search for a place or click on the map.'
    case err.POSITION_UNAVAILABLE:
      return 'Your location is not available right now.'
    case err.TIMEOUT:
      return 'Finding your location took too long. Please try again.'
    default:
      return 'Could not get your location.'
  }
}
