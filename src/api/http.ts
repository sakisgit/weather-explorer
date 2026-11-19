/**
 * Tiny fetch wrapper shared by all API calls.
 *
 * - Throws an `ApiError` with the HTTP status, so the retry logic can tell
 *   "server hiccup" (5xx, worth retrying) from "rate limited" (429, retrying makes it worse).
 * - Open-Meteo sends `{ error: true, reason: "..." }` on bad requests; we surface that reason.
 * - Accepts an AbortSignal: TanStack Query aborts requests whose result is no longer needed
 *   (e.g. the user kept typing), so we never waste quota on stale requests.
 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })

  if (!res.ok) {
    let reason = res.status === 429 ? 'Too many requests, please wait a moment' : `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { reason?: string }
      if (body.reason) reason = body.reason
    } catch {
      // body was not JSON, keep the generic message
    }
    throw new ApiError(reason, res.status)
  }

  return (await res.json()) as T
}
