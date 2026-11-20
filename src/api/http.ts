/**
 * Tiny fetch wrapper shared by all API calls.
 *
 * - Throws an `ApiError` with the HTTP status, so the retry logic can tell
 *   "server hiccup" (5xx, worth retrying) from "rate limited" (429, retrying makes it worse).
 * - Open-Meteo sends `{ error: true, reason: "..." }` on bad requests; we surface that reason.
 * - Accepts an AbortSignal: TanStack Query aborts requests whose result is no longer needed
 *   (e.g. the user kept typing), so we never waste quota on stale requests.
 * - Every request has a time limit, so a hanging connection can't leave a spinner forever.
 *   A timeout becomes an ApiError with status 0, which the retry logic treats like a
 *   network error (retried, unlike a 4xx).
 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const TIMEOUT_MS = 10_000

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  // Abort on whichever comes first: TanStack Query cancelling, or the time limit.
  // (AbortSignal.any is recent; without it we keep cancellation and skip the time limit.)
  let combined = timeout
  if (signal) combined = typeof AbortSignal.any === 'function' ? AbortSignal.any([signal, timeout]) : signal

  try {
    return await request<T>(url, combined)
  } catch (err) {
    // Only the time limit is reported as a timeout. A cancellation by TanStack Query
    // is passed on unchanged, and the library ignores it as intended.
    if (timeout.aborted && !signal?.aborted) {
      throw new ApiError('The weather service is taking too long to respond', 0)
    }
    throw err
  }
}

async function request<T>(url: string, signal: AbortSignal): Promise<T> {
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
