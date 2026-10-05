import { WMSProvider } from '@deltares/fews-wms-requests'
import {
  type MaybeRefOrGetter,
  onScopeDispose,
  ref,
  shallowRef,
  type Ref,
  toValue,
  watch,
} from 'vue'
import {
  type RefreshPolicy,
  useRefreshCoordinator,
} from '../useRefreshCoordinator/index.js'
import { resolveWebserviceContext } from '../lib/requests/resolveWebserviceContext.js'
import {
  DEFAULT_WMS_REFRESH_INTERVAL_MS,
  type UseWmsOptions,
  type UseWmsRequestReturn,
} from './options.js'
import { createWmsProvider } from './createWmsProvider.js'

type GetCapabilitiesResponse = Awaited<ReturnType<WMSProvider['getCapabilities']>>
type GetCapabilitiesFilter = Parameters<WMSProvider['getCapabilities']>[0]
type Layer = GetCapabilitiesResponse['layers'][number]

const DEFAULT_REFRESH_POLICIES: RefreshPolicy[] = [
  'onSystemTick',
  'onVisibilityResume',
]

export interface UseWmsLayerCapabilitiesOptions extends UseWmsOptions {
  /** Name of the WMS layer to load. */
  layerName: MaybeRefOrGetter<string | undefined>

  /** Optional overrides for the `GetCapabilities` request. */
  filter?: MaybeRefOrGetter<Partial<GetCapabilitiesFilter>>
}

export interface UseWmsReturn extends UseWmsRequestReturn {
  /**
   * The WMS capabilities of the requested layer, or `undefined` when no
   * layer is selected, or the request has not resolved yet.
   */
  layerCapabilities: Readonly<Ref<Layer | undefined>>

  /**
   * The available time values for the layer, restricted to the layer's
   * `firstValueTime`/`lastValueTime` range (if present), or `undefined`
   * when no layer is selected.
   */
  times: Readonly<Ref<Date[] | undefined>>

  /**
   * The full WMS `GetCapabilities` response, or `undefined` when no layer
   * is selected, or the request has not resolved yet.
   */
  capabilities: Readonly<Ref<GetCapabilitiesResponse | undefined>>

  /**
   * Reloads the capabilities and times. Called automatically when request
   * options change or a refresh is triggered.
   */
  loadCapabilities: () => Promise<void>
}

/**
 * @alpha This API is not yet stable and may change in future versions.
 *
 * Loads WMS `GetCapabilities` for a layer, and derives the layer's
 * capabilities and available time values from the response.
 *
 * By default, refreshes on system-time ticks and when visibility resumes.
 *
 * Reactively reloads when the layer or filter changes, and supports automatic
 * refreshing through `refresh`. On request failure,
 * `capabilities` and `layerCapabilities` are reset to `undefined`; the error
 * is exposed through `error` and rejected from an explicit `fetch()` call.
 *
 * @param options Request configuration. See {@link UseWmsLayerCapabilitiesOptions}.
 *
 *   Defaults applied when not overridden:
 *   - `importFromExternalDataSource`: `false`
 *   - `onlyHeaders`: `false`
 *   - `forecastCount`: `1`
 * @returns See {@link UseWmsReturn}.
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { useWmsLayerCapabilities } from '@deltares/fews-web-oc-composables'
 *
 * const options = {
 *   layerName: ref('waterlevel'),
 *   webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
 *   refresh: { policies: ['onInterval'], intervalMs: 30_000 },
 * }
 *
 * const { capabilities, layerCapabilities, times } =
 *   useWmsLayerCapabilities(options)
 * ```
 * @group Composables
 */
export function useWmsLayerCapabilities(
  options: UseWmsLayerCapabilitiesOptions
): UseWmsReturn {
  const enabled = options.enabled ?? ref(true)
  const webserviceContext = resolveWebserviceContext(options.webservice)
  const times = ref<Date[]>()
  const layerCapabilities = ref<Layer>()
  const capabilities = ref<GetCapabilitiesResponse>()
  const loading = ref(false)
  const refreshing = ref(false)
  const error = shallowRef<Error | null>(null)
  const hasLoaded = ref(false)
  let requestId = 0
  let abortController: AbortController | null = null

  function cancel(): void {
    requestId++
    abortController?.abort()
    abortController = null
    loading.value = false
    refreshing.value = false
  }

  async function fetch(): Promise<void> {
    if (!enabled.value) {
      return
    }

    cancel()
    const currentRequestId = requestId
    const layerName = toValue(options.layerName)
    const filter = toValue(options.filter)

    if (layerName === undefined) {
      error.value = null
      capabilities.value = undefined
      layerCapabilities.value = undefined
      times.value = undefined
      return
    }

    const controller = new AbortController()
    abortController = controller
    loading.value = !hasLoaded.value
    refreshing.value = hasLoaded.value
    error.value = null

    try {
      const wmsProvider = createWmsProvider(
        webserviceContext,
        () => controller.signal,
      )
      const response = await wmsProvider.getCapabilities({
        layers: layerName,
        importFromExternalDataSource: false,
        onlyHeaders: false,
        forecastCount: 1,
        ...filter
      })

      if (controller.signal.aborted || currentRequestId !== requestId) {
        return
      }

      capabilities.value = response
      layerCapabilities.value =
        response.layers?.find((layer) => layer.name === layerName) ??
        response.layers?.[0]
      loadTimes()
      hasLoaded.value = true
    } catch (cause) {
      if (controller.signal.aborted || currentRequestId !== requestId) {
        return
      }

      const requestError =
        cause instanceof Error ? cause : new Error(String(cause))
      error.value = requestError
      capabilities.value = undefined
      layerCapabilities.value = undefined
      times.value = undefined
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

  function loadTimes(): void {
    if (!layerCapabilities.value?.times) {
      times.value = undefined
      return
    }

    const dates = layerCapabilities.value.times.map((time) => new Date(time))
    const lastDate = dates.at(-1)
    if (lastDate === undefined) {
      times.value = []
      return
    }

    let firstValueDate = dates[0]
    let lastValueDate = lastDate
    if (layerCapabilities.value.firstValueTime) {
      firstValueDate = new Date(layerCapabilities.value.firstValueTime)
    }
    if (layerCapabilities.value.lastValueTime) {
      lastValueDate = new Date(layerCapabilities.value.lastValueTime)
    }

    times.value = dates.filter(
      (date) => date >= firstValueDate && date <= lastValueDate,
    )
  }

  const {
    policies = DEFAULT_REFRESH_POLICIES,
    intervalMs = DEFAULT_WMS_REFRESH_INTERVAL_MS,
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
    () => [toValue(options.layerName), toValue(options.filter)],
    () => refreshCoordinator.trigger(),
    { deep: true },
  )

  onScopeDispose(cancel, true)

  return {
    layerCapabilities,
    times,
    capabilities,
    loading,
    refreshing,
    error,
    hasLoaded,
    fetch,
    loadCapabilities: fetch,
    cancel,
    requestRefresh: refreshCoordinator.trigger,
    pauseRefresh: refreshCoordinator.pause,
    resumeRefresh: refreshCoordinator.resume,
    lastRefreshAt: refreshCoordinator.lastRefreshAt,
    lastTriggerPolicy: refreshCoordinator.lastTriggerPolicy,
  }
}