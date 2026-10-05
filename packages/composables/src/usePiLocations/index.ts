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
    * Changing the filter clears the current result and fetches locations for
    * the new filter automatically.
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
   * Whether the initial locations request is in progress.
   */
  loading: Readonly<Ref<boolean>>

  /**
   * Whether a subsequent locations request is in progress.
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
   * @returns The fetched locations.
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
 * const filter = ref({ filterIds: ['example-filter'] })
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

  watch(
    filter,
    () => {
      request.reset()
      geojson.value = emptyFeatureCollection
      if (filter.value !== undefined) {
        refreshCoordinator.trigger()
      }
    },
    { deep: true },
  )

  async function fetch(): Promise<void> {
    const currentFilter = filter.value
    if (currentFilter === undefined) {
      request.reset()
      geojson.value = emptyFeatureCollection
      return
    }

    await request.run(
      (signal) => {
        const provider = new PiWebserviceProvider(webserviceContext.baseUrl, {
          transformRequestFn: createTransformRequestFn(
            webserviceContext.getAuthorizationHeaders,
            () => signal,
          ),
        })
        const locationsFilter: PiLocationsFilter = {
          documentFormat: DocumentFormat.GEO_JSON,
          ...currentFilter,
        }
        return provider.getLocations(locationsFilter)
      },
      (response) => {
        geojson.value = response as unknown as FeatureCollection<
          Geometry,
          PiLocation
        >
      },
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
