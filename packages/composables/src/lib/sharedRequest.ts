interface InFlightRequest<T> {
  promise: Promise<T>
  controller: AbortController
  subscribers: number
}

const inFlightRequests = new Map<string, InFlightRequest<unknown>>()

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Aborted', 'AbortError')
}

/**
 * @beta
 *
 * Runs `run` at most once per `key` while a request with that key is pending.
 * Concurrent callers with the same key share the result.
 *
 * Aborting `signal` only detaches this caller; the underlying request is
 * aborted when all callers have detached. Settled requests are not cached,
 * so subsequent calls start a new request (HTTP caching is left to the browser).
 *
 * @param key Identifies the request, e.g. its normalised URL.
 * @param run Starts the request, it must honour the provided abort signal.
 * @param signal Optional signal to detach this caller.
 * @returns The (shared) result of `run`.
 * @group Other Functions
 */
export function sharedRequest<T>(
  key: string,
  run: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(abortReason(signal))
  }

  let entry = inFlightRequests.get(key) as InFlightRequest<T> | undefined
  if (!entry) {
    const controller = new AbortController()
    const created: InFlightRequest<T> = {
      controller,
      subscribers: 0,
      promise: Promise.resolve()
        .then(() => run(controller.signal))
        .finally(() => {
          if (inFlightRequests.get(key) === created) {
            inFlightRequests.delete(key)
          }
        }),
    }
    // Prevent an unhandled rejection when all subscribers detached before settling.
    created.promise.catch(() => {})
    entry = created
    inFlightRequests.set(key, entry)
  }

  const shared = entry
  shared.subscribers++

  return new Promise<T>((resolve, reject) => {
    let released = false

    const release = (): void => {
      if (released) return
      released = true
      signal?.removeEventListener('abort', onAbort)
      shared.subscribers--
      if (shared.subscribers === 0 && inFlightRequests.get(key) === shared) {
        inFlightRequests.delete(key)
        shared.controller.abort()
      }
    }

    function onAbort(): void {
      release()
      reject(abortReason(signal!))
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    shared.promise.then(
      (value) => {
        release()
        resolve(value)
      },
      (error: unknown) => {
        release()
        reject(error)
      },
    )
  })
}

/**
 * Returns the number of requests that are currently in flight.
 *
 * @internal
 */
export function getInFlightRequestCount(): number {
  return inFlightRequests.size
}
