import {
  type MaybeRefOrGetter,
  onScopeDispose,
  ref,
  shallowRef,
  type Ref,
  toValue,
  watch,
} from 'vue'
import { WMSProvider } from '@deltares/fews-wms-requests'
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

type GetLegendGraphicResponse = Awaited<ReturnType<WMSProvider['getLegendGraphic']>>
type GetCapabilitiesResponse = Awaited<ReturnType<WMSProvider['getCapabilities']>>
type Layer = GetCapabilitiesResponse['layers'][number]
type Style = NonNullable<Layer['styles']>[number]

const DEFAULT_REFRESH_POLICIES: RefreshPolicy[] = []

export interface UseWmsLegendOptions extends UseWmsOptions {
  /** Name of the layer to load the legend for. */
  layerName: MaybeRefOrGetter<string | undefined>

  /** Whether to render the legend using display units. */
  useDisplayUnits: MaybeRefOrGetter<boolean>

  /** Optional `"min,max"` color scale range override. */
  colorScaleRange?: MaybeRefOrGetter<string>

  /** Optional WMS style to render the legend with. */
  style?: MaybeRefOrGetter<Style>
}

export interface UseWmsLegendReturn extends UseWmsRequestReturn {
  /** The loaded WMS legend graphic. */
  legendGraphic: Readonly<Ref<GetLegendGraphicResponse | undefined>>
}

/**
 * @alpha This API is not yet stable and may change in future versions.
 *
 * Loads a WMS legend graphic for a layer, reactively reloading when legend
 * options change and supporting automatic refresh through `refresh`.
 * By default, no scheduled refresh policies are enabled.
 *
 * @param options Request configuration. See {@link UseWmsLegendOptions}.
 * @returns The legend graphic and request state. See {@link UseWmsLegendReturn}.
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { useWmsLegend } from '@deltares/fews-web-oc-composables'
 *
 * const options = {
 *   layerName: ref('waterlevel'),
 *   useDisplayUnits: true,
 *   webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
 *   refresh: { policies: ['onInterval'], intervalMs: 30_000 },
 * }
 *
 * const { legendGraphic, loading, error } = useWmsLegend(options)
 * ```
 * @group Composables
 */
export function useWmsLegend(
  options: UseWmsLegendOptions
): UseWmsLegendReturn {
  const enabled = options.enabled ?? ref(true)
  const webserviceContext = resolveWebserviceContext(options.webservice)
  const legendGraphic = ref<GetLegendGraphicResponse>()
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
    const useDisplayUnits = toValue(options.useDisplayUnits)
    const colorScaleRange = toValue(options.colorScaleRange)
    const style = toValue(options.style)

    if (layerName === undefined) {
      error.value = null
      legendGraphic.value = undefined
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
      const response = await wmsProvider.getLegendGraphic({
        layers: layerName,
        colorscalerange: colorScaleRange,
        useDisplayUnits,
        style: style?.name,
      })

      if (controller.signal.aborted || currentRequestId !== requestId) {
        return
      }

      legendGraphic.value = response
      hasLoaded.value = true
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
    () => [
      toValue(options.layerName),
      toValue(options.useDisplayUnits),
      toValue(options.colorScaleRange),
      toValue(options.style),
    ],
    () => refreshCoordinator.trigger(),
    { deep: true },
  )

  onScopeDispose(cancel, true)

  return {
    legendGraphic,
    loading,
    refreshing,
    error,
    hasLoaded,
    fetch,
    cancel,
    requestRefresh: refreshCoordinator.trigger,
    pauseRefresh: refreshCoordinator.pause,
    resumeRefresh: refreshCoordinator.resume,
    lastRefreshAt: refreshCoordinator.lastRefreshAt,
    lastTriggerPolicy: refreshCoordinator.lastTriggerPolicy,
  }
}