import {
  computed,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue'

import {
  DocumentFormat,
  PiWebserviceProvider,
  type TimeSeriesFilter,
  type TimeSeriesResponse,
} from '@deltares/fews-pi-requests'

import {
  type RefreshPolicy,
  useRefreshCoordinator,
} from '../useRefreshCoordinator/index.js'
import {
  type PiWebserviceOptions,
  resolveWebserviceContext,
} from '../lib/requests/resolveWebserviceContext.js'
import { createTransformRequestFn } from '../lib/requests/createTransformRequestFn.js'
import { sharedRequest } from '../shared/sharedRequest.js'
import {
  applyTimeSeriesQueryOptions,
  type PiTimeSeriesQueryOptions,
} from '../lib/timeseries/applyTimeSeriesQueryOptions.js'

const DEFAULT_REFRESH_POLICIES: RefreshPolicy[] = [
  'onSystemTick',
  'onVisibilityResume',
]

const DEFAULT_REFRESH_INTERVAL_MS = 30_000

/**
 * A keyed time series request, either a URL relative to the webservice base
 * URL (e.g. `ActionRequest.request`) or a time series filter.
 */
export type PiTimeSeriesRequest =
  | { key: string; relativeUrl: string }
  | { key: string; filter: TimeSeriesFilter }

export interface PiTimeSeriesEntry {
  /**
   * The most recent successful response, kept while refreshing.
   */
  response: TimeSeriesResponse | undefined

  /**
   * Whether the request is in progress and no response is available yet.
   */
  loading: boolean

  /**
   * Whether the request is in progress and a previous response is available.
   */
  refreshing: boolean

  /**
   * The error of the most recent request, or null when there is no error.
   */
  error: Error | null

  /**
   * The time at which the response was last updated successfully.
   */
  updatedAt: Date | undefined
}

export interface UsePiTimeSeriesOptions {
  /**
   * The time series requests, identified by a unique key.
   */
  requests: MaybeRefOrGetter<PiTimeSeriesRequest[]>

  /**
   * Query options applied to every request.
   */
  query?: MaybeRefOrGetter<PiTimeSeriesQueryOptions | undefined>

  /**
   * Controls whether time series may be fetched.
   *
   * @default ref(true)
   */
  enabled?: Ref<boolean>

  /**
   * Optional webservice configuration for standalone usage.
   *
   * When omitted, the host-provided webservice context is used.
   */
  webservice?: PiWebserviceOptions

  /**
   * Configuration for automatic time series refreshing.
   */
  refresh?: {
    /**
     * Policies that trigger an automatic refresh.
     *
     * @default ['onSystemTick', 'onVisibilityResume']
     */
    policies?: RefreshPolicy[]

    /**
     * Interval between automatic refreshes when 'onInterval' is enabled.
     *
     * @default 30000 (30 seconds)
     */
    intervalMs?: number

    /**
     * The system-time synchronization signal used by the `onSystemTick`
     * refresh policy.
     *
     * @default
     * When omitted, the host-provided system tick is used.
     */
    systemTick?: Ref<Date | undefined>

    /**
     * Whether to fetch immediately when the composable is created.
     *
     * @default true
     */
    immediate?: boolean
  }
}

export interface UsePiTimeSeriesReturn {
  /**
   * The state per request key.
   */
  entries: Readonly<ShallowRef<Record<string, PiTimeSeriesEntry>>>

  /**
   * The available responses per request key.
   */
  responses: ComputedRef<Record<string, TimeSeriesResponse>>

  /**
   * The errors per request key.
   */
  errors: ComputedRef<Record<string, Error>>

  /**
   * Whether any request is loading without a previous response.
   */
  loading: ComputedRef<boolean>

  /**
   * Whether any request is refreshing a previous response.
   */
  refreshing: ComputedRef<boolean>

  /**
   * The keys of the requests that are in progress.
   */
  loadingKeys: ComputedRef<string[]>

  /**
   * Fetches all time series immediately.
   */
  fetch: () => Promise<void>

  /**
   * Cancels the running requests of this instance.
   */
  cancel: () => void

  /**
   * Requests a refresh through the refresh coordinator.
   */
  requestRefresh: () => void

  /**
   * Pauses automatic refreshes.
   */
  pauseRefresh: () => void

  /**
   * Resumes automatic refreshes after they have been paused.
   */
  resumeRefresh: () => void

  /**
   * The time at which the most recent refresh completed.
   */
  lastRefreshAt: Readonly<Ref<Date | undefined>>

  /**
   * The policy that caused the most recent refresh.
   */
  lastTriggerPolicy: Readonly<Ref<RefreshPolicy | undefined>>
}

interface ResolvedRequest {
  key: string
  url: string
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause))
}

/**
 * @beta
 *
 * Fetches a set of FEWS PI time series and keeps them up to date via a
 * {@link useRefreshCoordinator}.
 *
 * Identical requests that are in flight at the same time, also from other
 * component instances, result in a single webservice request.
 *
 * @param options Configuration for the requests and automatic refreshing.
 *   See {@link UsePiTimeSeriesOptions}.
 * @returns Reactive responses and state per request key, and controls for
 *   fetching and refreshing. See {@link UsePiTimeSeriesReturn}.
 *
 * @example
 * ```ts
 * import { computed } from 'vue'
 * import { usePiTimeSeries } from '@deltares/fews-web-oc-composables'
 *
 * const requests = computed(() =>
 *   actionRequests.value.map((r) => ({ key: r.key, relativeUrl: r.request })),
 * )
 *
 * const { responses, loading } = usePiTimeSeries({
 *   requests,
 *   query: () => ({ startTime: start.value, endTime: end.value }),
 * })
 * ```
 * @group Composables
 */
export function usePiTimeSeries(
  options: UsePiTimeSeriesOptions,
): UsePiTimeSeriesReturn {
  const { requests, query, enabled = ref(true), webservice } = options

  const { baseUrl, getAuthorizationHeaders } =
    resolveWebserviceContext(webservice)

  const urlProvider = new PiWebserviceProvider(baseUrl)
  const absoluteBaseUrl = new URL(
    baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    (globalThis as { location?: Location }).location?.href,
  )

  const entries = shallowRef<Record<string, PiTimeSeriesEntry>>({})

  const responses = computed(() => {
    const result: Record<string, TimeSeriesResponse> = {}
    for (const [key, entry] of Object.entries(entries.value)) {
      if (entry.response) result[key] = entry.response
    }
    return result
  })
  const errors = computed(() => {
    const result: Record<string, Error> = {}
    for (const [key, entry] of Object.entries(entries.value)) {
      if (entry.error) result[key] = entry.error
    }
    return result
  })
  const loadingKeys = computed(() =>
    Object.keys(entries.value).filter(
      (key) => entries.value[key].loading || entries.value[key].refreshing,
    ),
  )
  const loading = computed(() =>
    Object.values(entries.value).some((entry) => entry.loading),
  )
  const refreshing = computed(() =>
    Object.values(entries.value).some((entry) => entry.refreshing),
  )

  const resolvedRequests = computed<ResolvedRequest[]>(() => {
    const queryOptions = toValue(query) ?? {}
    return toValue(requests).map((request) => {
      const url =
        'filter' in request
          ? urlProvider.timeSeriesUrl({
              documentFormat: DocumentFormat.PI_JSON,
              ...request.filter,
            })
          : new URL(request.relativeUrl, absoluteBaseUrl)
      return {
        key: request.key,
        url: applyTimeSeriesQueryOptions(url, queryOptions).toString(),
      }
    })
  })

  let abortController: AbortController | null = null
  let requestId = 0

  function cancel(): void {
    if (!abortController) return
    abortController.abort()
    abortController = null

    const next: Record<string, PiTimeSeriesEntry> = {}
    for (const [key, entry] of Object.entries(entries.value)) {
      next[key] = { ...entry, loading: false, refreshing: false }
    }
    entries.value = next
  }

  function updateEntry(key: string, patch: Partial<PiTimeSeriesEntry>): void {
    const current = entries.value[key]
    if (!current) return
    entries.value = { ...entries.value, [key]: { ...current, ...patch } }
  }

  function requestTimeSeries(
    url: string,
    signal: AbortSignal,
  ): Promise<TimeSeriesResponse> {
    return sharedRequest(
      url,
      (sharedSignal) => {
        const provider = new PiWebserviceProvider(baseUrl, {
          transformRequestFn: createTransformRequestFn(
            getAuthorizationHeaders,
            () => sharedSignal,
          ),
        })
        return provider.getTimeSeriesWithRelativeUrl(url)
      },
      signal,
    )
  }

  async function fetch(): Promise<void> {
    if (!enabled.value) return

    cancel()

    const controller = new AbortController()
    const currentRequestId = ++requestId
    abortController = controller

    const resolved = resolvedRequests.value

    const next: Record<string, PiTimeSeriesEntry> = {}
    for (const { key } of resolved) {
      const previous = entries.value[key]
      const hasResponse = previous?.response !== undefined
      next[key] = {
        response: previous?.response,
        updatedAt: previous?.updatedAt,
        error: null,
        loading: !hasResponse,
        refreshing: hasResponse,
      }
    }
    entries.value = next

    const isCurrent = () =>
      !controller.signal.aborted && currentRequestId === requestId

    await Promise.all(
      resolved.map(async ({ key, url }) => {
        try {
          const response = await requestTimeSeries(url, controller.signal)
          if (!isCurrent()) return
          updateEntry(key, {
            response,
            updatedAt: new Date(),
            loading: false,
            refreshing: false,
          })
        } catch (cause) {
          if (!isCurrent()) return
          updateEntry(key, {
            error: toError(cause),
            loading: false,
            refreshing: false,
          })
        }
      }),
    )

    if (currentRequestId === requestId) {
      abortController = null
    }
  }

  const {
    policies = DEFAULT_REFRESH_POLICIES,
    intervalMs = DEFAULT_REFRESH_INTERVAL_MS,
    immediate = true,
    systemTick,
  } = options.refresh ?? {}

  const refreshCoordinator = useRefreshCoordinator(fetch, {
    policies,
    intervalMs,
    immediateCallback: immediate,
    enabled,
    systemTick,
  })

  watch(
    () => JSON.stringify(resolvedRequests.value),
    () => void fetch(),
  )

  watch(enabled, (isEnabled) => {
    if (isEnabled) {
      void fetch()
    } else {
      cancel()
    }
  })

  onScopeDispose(() => {
    cancel()
    requestId++
  }, true)

  return {
    entries,
    responses,
    errors,
    loading,
    refreshing,
    loadingKeys,

    fetch,
    cancel,

    requestRefresh: refreshCoordinator.trigger,
    pauseRefresh: refreshCoordinator.pause,
    resumeRefresh: refreshCoordinator.resume,

    lastRefreshAt: refreshCoordinator.lastRefreshAt,
    lastTriggerPolicy: refreshCoordinator.lastTriggerPolicy,
  }
}
