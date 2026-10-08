import {
  computed,
  ref,
  shallowRef,
  type ComputedRef,
  type Ref,
  watch,
} from 'vue'

import {
  DocumentFormat,
  PiWebserviceProvider,
  type Location as PiLocation,
  type LocationsFilter as PiLocationsFilter,
} from '@deltares/fews-pi-requests'

import {
  type RefreshPolicy,
  useRefreshCoordinator,
} from '../useRefreshCoordinator/index.js'
import {
  type PiWebserviceOptions,
  resolveWebserviceContext,
} from '../lib/requests/resolveWebserviceContext.js'
import { createRequestRunner } from '../lib/requests/createRequestRunner.js'
import { createTransformRequestFn } from '../lib/requests/createTransformRequestFn.js'
import type { FeatureCollection, Geometry } from 'geojson'
import { convertGeoJsonToPiLocations } from '../lib/locations/convertGeoJsonToPiLocations.js'

const DEFAULT_REFRESH_POLICIES: RefreshPolicy[] = [
  'onSystemTick',
  'onInterval',
  'onVisibilityResume',
]

const DEFAULT_REFRESH_INTERVAL_MS = 300_000

export interface UsePiLocationsOptions {
  /**
   * Reactive filter used when fetching locations. When undefined, no request
   * is made and the result is empty.
   *
   * The current value is read when fetch() is executed.
   * Meaningful parameter changes clear the current result and fetch locations
   * for the new filter automatically. Equivalent replacements are ignored.
   */
  filter: Ref<PiLocationsFilter | undefined>

  /**
   * Controls whether locations may be fetched automatically.
   *
   * When false, refresh-coordinator triggers are ignored.
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
   * Configuration for automatic location refreshing.
   */
  refresh?: {
    /**
     * Policies that trigger an automatic refresh.
     *
     * @default ['onSystemTick', 'onInterval', 'onVisibilityResume']
     */
    policies?: RefreshPolicy[]

    /**
     * Interval between automatic refreshes when 'onInterval' is enabled.
     *
     * @default 300000 (5 minutes)
     */
    intervalMs?: number

    /**
     * The system-time synchronization signal used by the `onSystemTick`
     * refresh policy.
     *
     * Standalone applications can provide their own system tick.
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

export interface UsePiLocationsReturn {
  /**
   * The currently loaded locations.
   */
  locations: Readonly<Ref<PiLocation[]>>

  /**
   * The currently loaded locations as geojson.
   */
  geojson: Readonly<Ref<FeatureCollection<Geometry, PiLocation>>>

  /**
    * Whether a request is in progress without a successful result for the current filter.
   */
  loading: Readonly<Ref<boolean>>

  /**
    * Whether a request is in progress with a successful result for the current filter.
   */
  refreshing: Readonly<Ref<boolean>>

  /**
   * The error from the most recent locations request, or null when there is no error.
   */
  error: Readonly<Ref<Error | null>>

  /** Whether a successful result is available for the current filter. */
  hasLoaded: Readonly<Ref<boolean>>

  /** Whether a request has completed for the current filter, successfully or not. */
  hasAttempted: Readonly<Ref<boolean>>

  /**
   * Whether locations have been loaded successfully and the result is empty.
   */
  isEmpty: ComputedRef<boolean>

  /**
   * Fetches locations immediately using the current filter.
   *
    * Identical pending requests within this instance share the same promise.
    *
    * @returns A promise that resolves when the request completes or is cancelled.
   */
  fetch: () => Promise<void>

  /**
   * Cancels the currently running locations request, if any.
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
   * The time at which the most recent refresh completed successfully.
   */
  lastRefreshAt: Readonly<Ref<Date | undefined>>

  /**
   * The policy that caused the most recent refresh.
   */
  lastTriggerPolicy: Readonly<Ref<RefreshPolicy | undefined>>
}

const emptyFeatureCollection: FeatureCollection<Geometry, PiLocation> = {
  type: 'FeatureCollection',
  features: [],
}

/**
 * @beta
 *
 * Fetches FEWS PI locations matching a reactive filter, and keeps them
 * up to date automatically via a {@link useRefreshCoordinator}.
 *
 * @param options Configuration for the locations request and automatic
 *   refreshing. See {@link UsePiLocationsOptions}.
 * @returns Reactive locations/geojson data, loading/error state, and controls
 *   for fetching and refreshing. See {@link UsePiLocationsReturn}.
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { usePiLocations } from '@deltares/fews-web-oc-composables'
 *
 * const filter = ref({ filterId: 'example-filter' })
 *
 * const { locations, loading, error, isEmpty } = usePiLocations({ filter })
 * ```
 *
 * @example
 * ```ts
 * // Standalone usage, with custom refresh configuration
 * const { locations, requestRefresh } = usePiLocations({
 *   filter,
 *   webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
 *   refresh: {
 *     policies: ['onInterval'],
 *     intervalMs: 30_000,
 *     immediate: true,
 *   },
 * })
 * ```
 * @group Composables
 */
export function usePiLocations(
  options: UsePiLocationsOptions,
): UsePiLocationsReturn {
  const { filter, enabled = ref(true), webservice } = options

  const webserviceContext = resolveWebserviceContext(webservice)

  const geojson = shallowRef<FeatureCollection<Geometry, PiLocation>>(
    emptyFeatureCollection,
  )
  const request = createRequestRunner(enabled)

  const isEmpty = computed(
    () => request.hasLoaded.value && geojson.value.features.length === 0,
  )

  const requestKey = computed(() => {
    if (filter.value === undefined) return undefined

    const parameters = {
      documentFormat: DocumentFormat.GEO_JSON,
      ...Object.fromEntries(
        Object.entries(filter.value).filter(([, value]) => value !== undefined),
      ),
    }

    return JSON.stringify(parameters, (_key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.fromEntries(
          Object.keys(value)
            .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey))
            .map((key) => [key, value[key]]),
        )
      }
      return value
    })
  })

  watch(
    requestKey,
    () => {
      request.reset()
      geojson.value = emptyFeatureCollection
      void fetch().catch(() => {})
    },
    { flush: 'sync' },
  )

  function fetch(): Promise<void> {
    const key = requestKey.value
    if (key === undefined) {
      request.reset()
      geojson.value = emptyFeatureCollection
      return Promise.resolve()
    }
    if (!enabled.value) return Promise.resolve()

    const locationsFilter: PiLocationsFilter = JSON.parse(key)
    return request.run(
      (signal) => {
        const provider = new PiWebserviceProvider(webserviceContext.baseUrl, {
          transformRequestFn: createTransformRequestFn(
            webserviceContext.getAuthorizationHeaders,
            () => signal,
          ),
        })
        return provider.getLocations(locationsFilter)
      },
      (response) => {
        geojson.value = response as unknown as FeatureCollection<
          Geometry,
          PiLocation
        >
      },
      undefined,
      key,
    )
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

  const locations = computed(() => convertGeoJsonToPiLocations(geojson.value))

  return {
    geojson,
    locations,
    loading: request.loading,
    refreshing: request.refreshing,
    error: request.error,
    hasLoaded: request.hasLoaded,
    hasAttempted: request.hasAttempted,
    isEmpty,

    fetch,
    cancel: request.cancel,

    requestRefresh: refreshCoordinator.trigger,
    pauseRefresh: refreshCoordinator.pause,
    resumeRefresh: refreshCoordinator.resume,

    lastRefreshAt: refreshCoordinator.lastRefreshAt,
    lastTriggerPolicy: refreshCoordinator.lastTriggerPolicy,
  }
}