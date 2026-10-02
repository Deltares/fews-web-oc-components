interface InFlightRequest<T> {
  promise: Promise<T>
  controller: AbortController
  subscribers: number
  startedAt: number
}

/**
 * @beta
 *
 * Read-only snapshot of a request that is currently in flight via
 * {@link sharedRequest}.
 *
 * @group Interfaces
 */
export interface SharedRequestRegistration {
  /**
   * Key passed to {@link sharedRequest}, typically the request URL.
   * May contain sensitive data (e.g. query parameters or tokens); sanitise
   * it before displaying or logging.
   */
  readonly key: string
  /** Number of callers currently attached to the request. */
  readonly subscriberCount: number
  /** Time the request was registered, in milliseconds since the Unix epoch. */
  readonly startedAt: number
}

/**
 * @beta
 *
 * Receives the current in-flight request registrations.
 *
 * @group Type Aliases
 */
export type SharedRequestRegistrationsListener = (
  registrations: readonly SharedRequestRegistration[],
) => void

const inFlightRequests = new Map<string, InFlightRequest<unknown>>()
const listeners = new Set<SharedRequestRegistrationsListener>()
let snapshot: readonly SharedRequestRegistration[] | undefined

function createSnapshot(): readonly SharedRequestRegistration[] {
  const registrations: SharedRequestRegistration[] = []
  inFlightRequests.forEach((entry, key) => {
    registrations.push(
      Object.freeze({
        key,
        subscriberCount: entry.subscribers,
        startedAt: entry.startedAt,
      }),
    )
  })
  return Object.freeze(registrations)
}

function notifyRegistrationsChanged(): void {
  snapshot = undefined
  if (listeners.size === 0) return
  const current = getSharedRequestRegistrations()
  // Copy so listeners may (un)subscribe while being notified.
  Array.from(listeners).forEach((listener) => {
    if (!listeners.has(listener)) return
    try {
      listener(current)
    } catch (error) {
      // A faulty listener must not break request bookkeeping.
      console.error(error)
    }
  })
}

/**
 * @alpha
 *
 * Returns a snapshot of the requests that are currently in flight via
 * {@link sharedRequest}. Settled and fully aborted requests are not included.
 *
 * The returned array and its items are frozen. The same array instance is
 * returned until the registrations change.
 *
 * Registration keys may contain sensitive URL data.
 *
 * @returns The current in-flight request registrations.
 * @group Other Functions
 */
export function getSharedRequestRegistrations(): readonly SharedRequestRegistration[] {
  if (!snapshot) snapshot = createSnapshot()
  return snapshot
}

/**
 * @alpha
 *
 * Subscribes to changes of the in-flight request registrations. `listener` is
 * called immediately with the current snapshot, and again whenever a request
 * is registered, its subscriber count changes, or it is removed.
 *
 * Registration keys may contain sensitive URL data.
 *
 * @param listener Receives a frozen snapshot of the registrations.
 * @returns A function that unsubscribes `listener`.
 * @group Other Functions
 */
export function subscribeSharedRequestRegistrations(
  listener: SharedRequestRegistrationsListener,
): () => void {
  // Wrap so the same function can be subscribed more than once independently.
  const subscription: SharedRequestRegistrationsListener = (registrations) =>
    listener(registrations)
  listeners.add(subscription)
  try {
    subscription(getSharedRequestRegistrations())
  } catch (error) {
    listeners.delete(subscription)
    throw error
  }
  return () => {
    listeners.delete(subscription)
  }
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Aborted', 'AbortError')
}

/**
 * @alpha
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
      startedAt: Date.now(),
      promise: Promise.resolve()
        .then(() => run(controller.signal))
        .finally(() => {
          if (inFlightRequests.get(key) === created) {
            inFlightRequests.delete(key)
            notifyRegistrationsChanged()
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
  notifyRegistrationsChanged()

  return new Promise<T>((resolve, reject) => {
    let released = false

    const release = (): void => {
      if (released) return
      released = true
      signal?.removeEventListener('abort', onAbort)
      shared.subscribers--
      // Settled requests were already removed (and reported) by `finally`.
      if (inFlightRequests.get(key) !== shared) return
      if (shared.subscribers === 0) {
        inFlightRequests.delete(key)
        shared.controller.abort()
      }
      notifyRegistrationsChanged()
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
