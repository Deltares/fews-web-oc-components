import {
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'

import {
  DocumentFormat,
  type Location as PiLocation,
  type LocationsFilter as PiLocationsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'

import {
  resolveWebserviceContext,
  type PiWebserviceOptions,
} from '../useHostWebserviceContext'
import { createTransformRequestFn } from '../lib/createTransformRequestFn'
import { FeatureCollection, Geometry } from 'geojson'
import { convertGeoJsonToPiLocations } from '../lib/locations/convertGeoJsonToPiLocations'

export interface UseLocationsOptions {
  /**
   * Override the host-provided webservice configuration.
   *
   * If omitted, the WebOC host configuration is used.
   */
  webservice?: PiWebserviceOptions

  /**
   * Automatically load locations.
   *
   * @default true
   */
  immediate?: boolean
}

export interface UsePiLocationsReturn {
  /**
   * The latest successfully loaded locations.
   */
  geojson: Readonly<Ref<FeatureCollection<Geometry, PiLocation>>>

  /**
   * The latest successfully loaded locations.
   */
  locations: Readonly<ComputedRef<PiLocation[]>>

  /**
   * True while the initial request is running.
   */
  loading: Readonly<Ref<boolean>>

  /**
   * True while a subsequent refresh is running.
   */
  refreshing: Readonly<Ref<boolean>>

  /**
   * Error from the latest failed request.
   *
   * Aborted requests do not set this value.
   */
  error: Readonly<Ref<Error | null>>

  /**
   * True once at least one request has completed.
   */
  hasLoaded: Readonly<Ref<boolean>>

  /**
   * True when loading has completed and no locations
   * were returned.
   */
  isEmpty: ComputedRef<boolean>

  /**
   * Fetch the latest locations.
   *
   * A previous request is automatically aborted.
   */
  refresh: () => Promise<void>

  /**
   * Abort the current request.
   *
   * Existing locations are retained.
   */
  abort: () => void
}

export interface UsePiLocationsOptions {
  /**
   * Reactive filter used when loading locations.
   */
  filter: Ref<PiLocationsFilter>

  /**
   * Controls whether locations may be loaded.
   *
   * When false, no request is made.
   *
   * @default true
   */
  enabled?: Ref<boolean>

  /**
   * Override the host-provided webservice configuration.
   */
  webservice?: PiWebserviceOptions

  /**
   * Whether to load locations immediately.
   *
   * @default true
   */
  immediate?: boolean

  /**
   * Whether to automatically reload locations when the filter changes.
   *
   * @default true
   */
  watchFilter?: boolean
}

const emptyFeatureCollection: FeatureCollection<Geometry, PiLocation> = {
  type: 'FeatureCollection',
  features: [],
}

export function usePiLocations(
  options: UsePiLocationsOptions,
): UsePiLocationsReturn {
  const {
    filter,
    enabled = ref(true),
    immediate = true,
    webservice,
    watchFilter = true,
  } = options

  const webserviceContext = resolveWebserviceContext(webservice)

  const geojson = shallowRef<FeatureCollection<Geometry, PiLocation>>(
    emptyFeatureCollection,
  )
  const loading = ref(false)
  const refreshing = ref(false)
  const error = shallowRef<Error | null>(null)
  const hasLoaded = ref(false)

  const isEmpty = computed(
    () => hasLoaded.value && geojson.value.features.length === 0,
  )

  let abortController: AbortController | null = null
  let requestId = 0

  const provider = new PiWebserviceProvider(webserviceContext.baseUrl, {
    transformRequestFn: createTransformRequestFn(
      webserviceContext.getAuthorizationHeaders,
      () => abortController?.signal,
    ),
  })

  function abort(): void {
    abortController?.abort()
    abortController = null
  }

  async function refresh(): Promise<void> {
    if (!enabled.value) {
      return
    }

    abort()

    const controller = new AbortController()
    const currentRequestId = ++requestId

    abortController = controller
    loading.value = !hasLoaded.value
    refreshing.value = hasLoaded.value
    error.value = null

    try {
      // Always read the current reactive filter when starting the request.
      const locationsFilter: PiLocationsFilter = {
        documentFormat: DocumentFormat.GEO_JSON,
        ...filter.value,
      }
      console.log('filter', locationsFilter)
      const response = await provider.getLocations(locationsFilter)
      if (!isFeatureCollection(response)) {
        throw new Error('Expected GeoJSON FeatureCollection')
      }

      if (controller.signal.aborted || currentRequestId !== requestId) {
        return
      }

      geojson.value = response as unknown as FeatureCollection<
        Geometry,
        PiLocation
      >
      hasLoaded.value = true
      return
    } catch (cause) {
      if (controller.signal.aborted || currentRequestId !== requestId) {
        return
      }

      const requestError =
        cause instanceof Error ? cause : new Error(String(cause))

      error.value = requestError
      hasLoaded.value = true

      throw requestError
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false
        refreshing.value = false
        abortController = null
      }
    }
  }

  if (watchFilter) {
    watch(
      filter,
      () => {
        if (enabled.value) {
          void refresh()
        }
      },
      { deep: true },
    )
  }

  watch(enabled, (isEnabled) => {
    if (isEnabled) {
      if (immediate) {
        void refresh()
      }
    } else {
      abort()
    }
  })

  onBeforeUnmount(() => {
    abort()
    requestId++
  })

  if (immediate && enabled.value) {
    void refresh()
  }

  const locations = computed(() => convertGeoJsonToPiLocations(geojson.value))

  return {
    geojson,
    locations,
    loading,
    refreshing,
    error,
    hasLoaded,
    isEmpty,
    refresh,
    abort,
  }
}

function isFeatureCollection(
  geojson: FeatureCollection<Geometry, Location> | unknown, // NOSONAR(S6571) - valid use of unknown in typeguard
): geojson is FeatureCollection<Geometry, Location> {
  return (
    (geojson as FeatureCollection<Geometry, Location>).type ===
    'FeatureCollection'
  )
}
